import * as vscode from 'vscode';
import * as crypto from 'crypto';

/**
 * MedicineStorageManager - Handles encrypted storage of medicine data
 * Uses AES-256-GCM encryption with a machine-specific key
 */
export class MedicineStorageManager {
    private readonly ENCRYPTION_KEY_ID = 'medicineEncryptionKey';
    private readonly MEDICINES_DATA_KEY = 'encryptedMedicinesData';
    private readonly ALGORITHM = 'aes-256-gcm';
    private encryptionKey: Buffer | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.initializeEncryptionKey();
    }

    /**
     * Initialize or retrieve encryption key from VS Code secret storage
     */
    private async initializeEncryptionKey(): Promise<void> {
        try {
            // Try to get existing key from secret storage
            let keyString = await this.context.secrets.get(this.ENCRYPTION_KEY_ID);
            
            if (!keyString) {
                // Generate a new 256-bit key
                const key = crypto.randomBytes(32);
                keyString = key.toString('base64');
                
                // Store in secret storage (encrypted by VS Code)
                await this.context.secrets.store(this.ENCRYPTION_KEY_ID, keyString);
                console.log('[MedicineStorage] Generated and stored new encryption key');
            }
            
            this.encryptionKey = Buffer.from(keyString, 'base64');
        } catch (error) {
            console.error('[MedicineStorage] Error initializing encryption key:', error);
            throw new Error('Failed to initialize medicine storage encryption');
        }
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    private encrypt(plaintext: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        try {
            // Generate random IV (Initialization Vector)
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);
            
            // Encrypt the data
            let encrypted = cipher.update(plaintext, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            // Get authentication tag
            const authTag = cipher.getAuthTag();
            
            // Combine IV + AuthTag + Encrypted Data (all base64 encoded)
            const result = {
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                data: encrypted
            };
            
            return JSON.stringify(result);
        } catch (error) {
            console.error('[MedicineStorage] Encryption error:', error);
            throw new Error('Failed to encrypt medicine data');
        }
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    private decrypt(ciphertext: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        try {
            const { iv, authTag, data } = JSON.parse(ciphertext);
            
            // Create decipher
            const decipher = crypto.createDecipheriv(
                this.ALGORITHM,
                this.encryptionKey,
                Buffer.from(iv, 'base64')
            );
            
            // Set authentication tag
            decipher.setAuthTag(Buffer.from(authTag, 'base64'));
            
            // Decrypt the data
            let decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('[MedicineStorage] Decryption error:', error);
            throw new Error('Failed to decrypt medicine data');
        }
    }

    /**
     * Save medicines data (encrypted)
     */
    async saveMedicines(medicines: any[]): Promise<void> {
        try {
            // Wait for encryption key if not initialized
            if (!this.encryptionKey) {
                await this.initializeEncryptionKey();
            }

            // Convert to JSON
            const jsonData = JSON.stringify(medicines);
            
            // Encrypt the data
            const encryptedData = this.encrypt(jsonData);
            
            // Store in globalState (not readable without decryption)
            await this.context.globalState.update(this.MEDICINES_DATA_KEY, encryptedData);
            
            console.log('[MedicineStorage] Saved', medicines.length, 'medicines (encrypted)');
        } catch (error) {
            console.error('[MedicineStorage] Error saving medicines:', error);
            vscode.window.showErrorMessage('Failed to save medicine data securely');
            throw error;
        }
    }

    /**
     * Load medicines data (decrypt)
     */
    async loadMedicines(): Promise<any[]> {
        try {
            // Wait for encryption key if not initialized
            if (!this.encryptionKey) {
                await this.initializeEncryptionKey();
            }

            // Get encrypted data from storage
            const encryptedData = this.context.globalState.get<string>(this.MEDICINES_DATA_KEY);
            
            if (!encryptedData) {
                console.log('[MedicineStorage] No medicines data found');
                return [];
            }
            
            // Decrypt the data
            const jsonData = this.decrypt(encryptedData);
            
            // Parse JSON
            const medicines = JSON.parse(jsonData);
            
            console.log('[MedicineStorage] Loaded', medicines.length, 'medicines (decrypted)');
            return medicines;
        } catch (error) {
            console.error('[MedicineStorage] Error loading medicines:', error);
            vscode.window.showWarningMessage('Failed to load medicine data. Starting fresh.');
            return [];
        }
    }

    /**
     * Delete all medicine data
     */
    async clearAllMedicines(): Promise<void> {
        try {
            await this.context.globalState.update(this.MEDICINES_DATA_KEY, undefined);
            console.log('[MedicineStorage] Cleared all medicine data');
        } catch (error) {
            console.error('[MedicineStorage] Error clearing medicines:', error);
            throw error;
        }
    }

    /**
     * Export medicines data (encrypted) for backup
     */
    async exportEncryptedBackup(): Promise<string> {
        const encryptedData = this.context.globalState.get<string>(this.MEDICINES_DATA_KEY);
        if (!encryptedData) {
            throw new Error('No medicine data to export');
        }
        return encryptedData;
    }

    /**
     * Import medicines data from encrypted backup
     */
    async importEncryptedBackup(encryptedData: string): Promise<void> {
        try {
            // Validate by attempting to decrypt
            const jsonData = this.decrypt(encryptedData);
            const medicines = JSON.parse(jsonData);
            
            if (!Array.isArray(medicines)) {
                throw new Error('Invalid backup data format');
            }
            
            await this.context.globalState.update(this.MEDICINES_DATA_KEY, encryptedData);
            console.log('[MedicineStorage] Imported backup with', medicines.length, 'medicines');
        } catch (error) {
            console.error('[MedicineStorage] Error importing backup:', error);
            throw new Error('Failed to import backup. Data may be corrupted or from different machine.');
        }
    }

    /**
     * Get storage statistics
     */
    getStorageInfo(): { isEncrypted: boolean; algorithm: string; hasData: boolean } {
        const hasData = !!this.context.globalState.get(this.MEDICINES_DATA_KEY);
        return {
            isEncrypted: true,
            algorithm: this.ALGORITHM,
            hasData
        };
    }

    // --- Password & Lock System ---

    private readonly PASSWORD_KEY = 'medicineLockPassword';
    private readonly IS_LOCKED_KEY = 'medicineIsLocked';
    private readonly SECURITY_QUESTIONS_KEY = 'medicineSecurityQuestions';

    /**
     * Set a new password (hashed) or clear password if empty string provided
     */
    async setPassword(password: string): Promise<void> {
        if (!password) {
            // Clear password if empty string
            await this.context.globalState.update(this.PASSWORD_KEY, undefined);
            return;
        }
        // Hash password with SHA-256
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        // Store hash in globalState (or secrets if preferred, but hash is safe enough for this)
        await this.context.globalState.update(this.PASSWORD_KEY, hash);
    }

    /**
     * Verify password against stored hash
     */
    async verifyPassword(password: string): Promise<boolean> {
        const storedHash = this.context.globalState.get<string>(this.PASSWORD_KEY);
        if (!storedHash) return true; // No password set = always valid (or handle as error)
        
        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        return storedHash === inputHash;
    }

    /**
     * Get hashed password (to check if one exists)
     */
    async getPassword(): Promise<string | undefined> {
        return this.context.globalState.get<string>(this.PASSWORD_KEY);
    }

    /**
     * Set lock state
     */
    async setIsLocked(locked: boolean): Promise<void> {
        await this.context.globalState.update(this.IS_LOCKED_KEY, locked);
    }

    /**
     * Get lock state
     */
    async getIsLocked(): Promise<boolean> {
        return this.context.globalState.get<boolean>(this.IS_LOCKED_KEY, false);
    }

    /**
     * Set security questions and answers (hashed)
     */
    async setSecurityQuestions(questionsAndAnswers: Array<{question: string, answer: string}>): Promise<void> {
        const hashedQA = questionsAndAnswers.map(qa => ({
            question: qa.question,
            answerHash: crypto.createHash('sha256').update(qa.answer.toLowerCase().trim()).digest('hex')
        }));
        await this.context.globalState.update(this.SECURITY_QUESTIONS_KEY, hashedQA);
    }

    /**
     * Get security questions (without answers)
     */
    async getSecurityQuestions(): Promise<string[]> {
        const stored = this.context.globalState.get<Array<{question: string, answerHash: string}>>(this.SECURITY_QUESTIONS_KEY);
        if (!stored) return [];
        return stored.map(qa => qa.question);
    }

    /**
     * Verify security answers
     */
    async verifySecurityAnswers(answers: string[]): Promise<boolean> {
        const stored = this.context.globalState.get<Array<{question: string, answerHash: string}>>(this.SECURITY_QUESTIONS_KEY);
        if (!stored || stored.length !== answers.length) return false;

        for (let i = 0; i < stored.length; i++) {
            const inputHash = crypto.createHash('sha256').update(answers[i].toLowerCase().trim()).digest('hex');
            if (inputHash !== stored[i].answerHash) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if security questions are set
     */
    async hasSecurityQuestions(): Promise<boolean> {
        const stored = this.context.globalState.get<Array<{question: string, answerHash: string}>>(this.SECURITY_QUESTIONS_KEY);
        return !!(stored && stored.length > 0);
    }

    /**
     * Clear security questions
     */
    async clearSecurityQuestions(): Promise<void> {
        await this.context.globalState.update(this.SECURITY_QUESTIONS_KEY, undefined);
    }}
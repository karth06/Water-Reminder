import React, { useState, useRef, useEffect, TouchEvent, MouseEvent } from 'react';
import MedicineCard, { Medicine } from './MedicineCard';

interface MedicinePaginationProps {
    medicines: Medicine[];
    theme: any;
    onEdit: (medicine: Medicine) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string) => void;
    onToggleIntake?: (medicineId: string, date: string, timeIndex: number) => void;
    itemsPerPage?: number;
}

const MedicinePagination: React.FC<MedicinePaginationProps> = ({
    medicines,
    theme,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleIntake,
    itemsPerPage = 2
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [mouseDown, setMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const totalPages = Math.ceil(medicines.length / itemsPerPage);
    const minSwipeDistance = 50;

    const currentMedicines = medicines.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    // Touch handlers
    const handleTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
        if (isRightSwipe && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Mouse drag handlers
    const handleMouseDown = (e: MouseEvent) => {
        setMouseDown(true);
        setStartX(e.clientX);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!mouseDown) return;
        const diff = e.clientX - startX;
        setTranslateX(diff);
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!mouseDown) return;
        setMouseDown(false);
        
        const diff = e.clientX - startX;
        const isLeftDrag = diff < -minSwipeDistance;
        const isRightDrag = diff > minSwipeDistance;

        if (isLeftDrag && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
        if (isRightDrag && currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }

        setTranslateX(0);
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grab';
        }
    };

    const handleMouseLeave = () => {
        if (mouseDown) {
            setMouseDown(false);
            setTranslateX(0);
            if (containerRef.current) {
                containerRef.current.style.cursor = 'grab';
            }
        }
    };

    useEffect(() => {
        // Reset to first page if current page exceeds total pages
        if (currentPage >= totalPages && totalPages > 0) {
            setCurrentPage(0);
        }
    }, [medicines.length, currentPage, totalPages]);

    if (medicines.length === 0) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: theme.neutral.glass,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: `1px solid ${theme.neutral.border}`,
                    marginBottom: '20px'
                }}
            >
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💊</div>
                <h3
                    style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: theme.neutral.text
                    }}
                >
                    No Medicines Yet
                </h3>
                <p
                    style={{
                        margin: 0,
                        fontSize: '13px',
                        color: theme.neutral.textSoft,
                        lineHeight: '1.5'
                    }}
                >
                    Add your first medicine to get started with reminders
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            {/* Swipeable Container */}
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'grab',
                    userSelect: 'none'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        transition: mouseDown ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: `translateX(${translateX}px)`
                    }}
                >
                    {currentMedicines.map((medicine) => (
                        <MedicineCard
                            key={medicine.id}
                            medicine={medicine}
                            theme={theme}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleActive={onToggleActive}
                            onToggleIntake={onToggleIntake}
                        />
                    ))}
                </div>
            </div>

            {/* Pagination Indicators */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '20px',
                        padding: '16px',
                        background: theme.neutral.glass,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: `1px solid ${theme.neutral.border}`
                    }}
                >
                    {/* Previous Button */}
                    <button
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        style={{
                            padding: '8px 12px',
                            background: currentPage === 0 ? theme.neutral.glass : theme.primary.glass,
                            border: `1px solid ${currentPage === 0 ? theme.neutral.border : theme.primary.base}`,
                            borderRadius: '10px',
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            color: currentPage === 0 ? theme.neutral.textSoft : theme.primary.base,
                            fontSize: '14px',
                            fontWeight: '600',
                            opacity: currentPage === 0 ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        ← Prev
                    </button>

                    {/* Page Indicators */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index)}
                                style={{
                                    width: currentPage === index ? '32px' : '8px',
                                    height: '8px',
                                    padding: 0,
                                    background:
                                        currentPage === index
                                            ? `linear-gradient(90deg, ${theme.primary.base}, ${theme.accent.sage})`
                                            : theme.neutral.border,
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow:
                                        currentPage === index
                                            ? `0 2px 8px ${theme.primary.base}40`
                                            : 'none'
                                }}
                                aria-label={`Go to page ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        style={{
                            padding: '8px 12px',
                            background: currentPage === totalPages - 1 ? theme.neutral.glass : theme.primary.glass,
                            border: `1px solid ${currentPage === totalPages - 1 ? theme.neutral.border : theme.primary.base}`,
                            borderRadius: '10px',
                            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                            color: currentPage === totalPages - 1 ? theme.neutral.textSoft : theme.primary.base,
                            fontSize: '14px',
                            fontWeight: '600',
                            opacity: currentPage === totalPages - 1 ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Page Counter */}
            <div
                style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    fontSize: '11px',
                    color: theme.neutral.textSoft,
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                }}
            >
                Page {currentPage + 1} of {totalPages} • {medicines.length} Total Medicine{medicines.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default MedicinePagination;

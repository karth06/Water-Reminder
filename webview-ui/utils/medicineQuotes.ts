/**
 * Medicine Quote Fetcher
 * Fetches healing and motivational quotes from API with static fallback
 */

export interface MedicineQuote {
    text: string;
    icon: string;
    category: 'healing' | 'courage' | 'patience' | 'gratitude';
    author?: string;
}

// Static fallback quotes - Authentic, positive, encouraging
const STATIC_MEDICINE_QUOTES: MedicineQuote[] = [
    // Healing & Recovery - Medical authorities & wisdom
    {
        text: "Healing is a matter of time, but it is sometimes also a matter of opportunity.",
        icon: "🌱",
        category: "healing",
        author: "Hippocrates"
    },
    {
        text: "The natural healing force within each of us is the greatest force in getting well.",
        icon: "✨",
        category: "healing",
        author: "Hippocrates"
    },
    {
        text: "The greatest wealth is health.",
        icon: "💎",
        category: "healing",
        author: "Virgil"
    },
    {
        text: "Take care of your body. It's the only place you have to live.",
        icon: "🏡",
        category: "healing",
        author: "Jim Rohn"
    },
    {
        text: "Health is a state of complete harmony of the body, mind and spirit.",
        icon: "🌸",
        category: "healing",
        author: "B.K.S. Iyengar"
    },
    {
        text: "To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.",
        icon: "🧘",
        category: "healing",
        author: "Buddha"
    },
    {
        text: "Your body hears everything your mind says. Stay positive.",
        icon: "💚",
        category: "healing",
        author: "Naomi Judd"
    },
    {
        text: "The groundwork for all happiness is good health.",
        icon: "🌻",
        category: "healing",
        author: "Leigh Hunt"
    },
    {
        text: "A healthy outside starts from the inside.",
        icon: "🌿",
        category: "healing",
        author: "Robert Urich"
    },
    {
        text: "He who has health has hope, and he who has hope has everything.",
        icon: "🌈",
        category: "healing",
        author: "Thomas Carlyle"
    },

    // Courage & Strength - Inspiring leaders & thinkers
    {
        text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
        icon: "🦁",
        category: "courage",
        author: "A.A. Milne"
    },
    {
        text: "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
        icon: "🌟",
        category: "courage",
        author: "Mary Anne Radmacher"
    },
    {
        text: "The human spirit is stronger than anything that can happen to it.",
        icon: "🔥",
        category: "courage",
        author: "C.C. Scott"
    },
    {
        text: "Believe you can and you're halfway there.",
        icon: "🎯",
        category: "courage",
        author: "Theodore Roosevelt"
    },
    {
        text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
        icon: "🌠",
        category: "courage",
        author: "Ralph Waldo Emerson"
    },
    {
        text: "With the new day comes new strength and new thoughts.",
        icon: "☀️",
        category: "courage",
        author: "Eleanor Roosevelt"
    },
    {
        text: "It does not matter how slowly you go as long as you do not stop.",
        icon: "🚶",
        category: "courage",
        author: "Confucius"
    },
    {
        text: "The only impossible journey is the one you never begin.",
        icon: "🛤️",
        category: "courage",
        author: "Tony Robbins"
    },
    {
        text: "Turn your wounds into wisdom.",
        icon: "💫",
        category: "courage",
        author: "Oprah Winfrey"
    },
    {
        text: "Out of difficulties grow miracles.",
        icon: "🌺",
        category: "courage",
        author: "Jean de La Bruyère"
    },

    // Patience & Hope - Uplifting wisdom
    {
        text: "Hope is being able to see that there is light despite all of the darkness.",
        icon: "🕯️",
        category: "patience",
        author: "Desmond Tutu"
    },
    {
        text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.",
        icon: "🌻",
        category: "patience",
        author: "Joyce Meyer"
    },
    {
        text: "Every day may not be good, but there's something good in every day.",
        icon: "☀️",
        category: "patience",
        author: "Alice Morse Earle"
    },
    {
        text: "Hope is the thing with feathers that perches in the soul.",
        icon: "🕊️",
        category: "patience",
        author: "Emily Dickinson"
    },
    {
        text: "Patience is bitter, but its fruit is sweet.",
        icon: "🍊",
        category: "patience",
        author: "Aristotle"
    },
    {
        text: "Even the darkest night will end and the sun will rise.",
        icon: "🌅",
        category: "patience",
        author: "Victor Hugo"
    },
    {
        text: "The best way out is always through.",
        icon: "🚪",
        category: "patience",
        author: "Robert Frost"
    },
    {
        text: "This too shall pass.",
        icon: "🌊",
        category: "patience",
        author: "Persian Proverb"
    },
    {
        text: "It always seems impossible until it's done.",
        icon: "✅",
        category: "patience",
        author: "Nelson Mandela"
    },
    {
        text: "One small positive thought can change your whole day.",
        icon: "💭",
        category: "patience",
        author: "Zig Ziglar"
    },

    // Gratitude & Positive Mindset
    {
        text: "Gratitude turns what we have into enough.",
        icon: "🙏",
        category: "gratitude",
        author: "Melody Beattie"
    },
    {
        text: "Be thankful for what you have; you'll end up having more.",
        icon: "💝",
        category: "gratitude",
        author: "Oprah Winfrey"
    },
    {
        text: "When you arise in the morning, think of what a precious privilege it is to be alive.",
        icon: "☀️",
        category: "gratitude",
        author: "Marcus Aurelius"
    },
    {
        text: "Gratitude is not only the greatest of virtues, but the parent of all others.",
        icon: "💐",
        category: "gratitude",
        author: "Cicero"
    },
    {
        text: "In the middle of difficulty lies opportunity.",
        icon: "🎁",
        category: "gratitude",
        author: "Albert Einstein"
    },
    {
        text: "The secret of health for both mind and body is not to mourn for the past, nor to worry about the future, but to live the present moment wisely.",
        icon: "🎋",
        category: "gratitude",
        author: "Buddha"
    },
    {
        text: "Happiness is not something ready made. It comes from your own actions.",
        icon: "😊",
        category: "gratitude",
        author: "Dalai Lama"
    },
    {
        text: "The mind is everything. What you think you become.",
        icon: "🧠",
        category: "gratitude",
        author: "Buddha"
    },
    {
        text: "Act as if what you do makes a difference. It does.",
        icon: "⭐",
        category: "gratitude",
        author: "William James"
    },
    {
        text: "Keep your face always toward the sunshine, and shadows will fall behind you.",
        icon: "🌞",
        category: "gratitude",
        author: "Walt Whitman"
    }
];

/**
 * Fetch quote from Quotable API (free, no auth required)
 */
async function fetchQuoteFromAPI(): Promise<MedicineQuote | null> {
    try {
        // Use Quotable API with tags related to healing and motivation
        const tags = 'inspirational|wisdom|health|courage|perseverance';
        const response = await fetch(`https://api.quotable.io/random?tags=${tags}&maxLength=150`);
        
        if (!response.ok) {
            console.log('[QuoteFetcher] API response not OK:', response.status);
            return null;
        }

        const data = await response.json();
        
        // Map to our quote format
        const quote: MedicineQuote = {
            text: data.content,
            icon: getIconForQuote(data.content),
            category: getCategoryForQuote(data.content),
            author: data.author
        };

        console.log('[QuoteFetcher] Successfully fetched quote from API');
        return quote;
    } catch (error) {
        console.error('[QuoteFetcher] Error fetching from API:', error);
        return null;
    }
}

/**
 * Get appropriate icon based on quote content
 */
function getIconForQuote(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('heal') || lowerText.includes('health')) return '🌱';
    if (lowerText.includes('courage') || lowerText.includes('brave')) return '💪';
    if (lowerText.includes('hope') || lowerText.includes('faith')) return '🕊️';
    if (lowerText.includes('grateful') || lowerText.includes('thank')) return '🙏';
    if (lowerText.includes('strength') || lowerText.includes('strong')) return '💪';
    if (lowerText.includes('love') || lowerText.includes('heart')) return '❤️';
    
    // Default icons
    const icons = ['✨', '🌟', '💫', '🌺', '🌸', '🦋'];
    return icons[Math.floor(Math.random() * icons.length)];
}

/**
 * Categorize quote based on content
 */
function getCategoryForQuote(text: string): 'healing' | 'courage' | 'patience' | 'gratitude' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('heal') || lowerText.includes('health') || lowerText.includes('recover')) {
        return 'healing';
    }
    if (lowerText.includes('courage') || lowerText.includes('brave') || lowerText.includes('strength')) {
        return 'courage';
    }
    if (lowerText.includes('patient') || lowerText.includes('hope') || lowerText.includes('wait')) {
        return 'patience';
    }
    if (lowerText.includes('grateful') || lowerText.includes('thank') || lowerText.includes('bless')) {
        return 'gratitude';
    }
    
    // Default to healing
    return 'healing';
}

/**
 * Get random quote from static collection by category
 */
function getStaticQuote(category?: 'healing' | 'courage' | 'patience' | 'gratitude'): MedicineQuote {
    let quotes = STATIC_MEDICINE_QUOTES;
    
    if (category) {
        quotes = STATIC_MEDICINE_QUOTES.filter(q => q.category === category);
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

/**
 * Main function: Try API first, fallback to static
 */
export async function getMedicineQuote(category?: 'healing' | 'courage' | 'patience' | 'gratitude'): Promise<MedicineQuote> {
    // Try to fetch from API first
    const apiQuote = await fetchQuoteFromAPI();
    
    if (apiQuote && (!category || apiQuote.category === category)) {
        return apiQuote;
    }
    
    // Fallback to static quotes
    console.log('[QuoteFetcher] Using static fallback quote');
    return getStaticQuote(category);
}

/**
 * Get multiple quotes (for variety)
 */
export async function getMultipleMedicineQuotes(count: number = 3): Promise<MedicineQuote[]> {
    const quotes: MedicineQuote[] = [];
    
    for (let i = 0; i < count; i++) {
        const quote = await getMedicineQuote();
        quotes.push(quote);
    }
    
    return quotes;
}

/**
 * Format quote for display
 */
export function formatQuoteForDisplay(quote: MedicineQuote): string {
    const authorText = quote.author ? ` — ${quote.author}` : '';
    return `${quote.icon} "${quote.text}"${authorText}`;
}

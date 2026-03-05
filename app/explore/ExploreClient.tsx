'use client'

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    SlidersHorizontal,
    X,
    Sparkles,
    Clock,
    Grid3X3,
    Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Price } from "@/components/Price"
import { cn } from "@/lib/utils"

import { ExploreCard, ExploreItem, ItemType } from "@/components/ExploreCard"

interface ExploreClientProps {
    initialItems: ExploreItem[]
    categories: string[]
    priceRange: { min: number; max: number }
    isDashboard?: boolean
    userRole?: string
}

type SortOption = 'recommended' | 'newest' | 'price_low' | 'price_high' | 'rating'
type ViewMode = 'grid' | 'list'

export function ExploreClient({ initialItems, categories, priceRange, isDashboard = false, userRole }: ExploreClientProps) {
    // State
    const [activeTab, setActiveTab] = useState<ItemType>(userRole === 'SELLER' ? 'JOB' : 'ALL')
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [budgetRange, setBudgetRange] = useState<[number, number]>([priceRange.min, priceRange.max])
    const [maxDeliveryTime, setMaxDeliveryTime] = useState<string>('any')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [sortBy, setSortBy] = useState<SortOption>('recommended')

    // Track input strings locally for better typing experience
    const [minInput, setMinInput] = useState(budgetRange[0].toString())
    const [maxInput, setMaxInput] = useState(budgetRange[1].toString())

    // Update local inputs when budgetRange changes (e.g. from slider)
    useEffect(() => {
        setMinInput(budgetRange[0].toString())
        setMaxInput(budgetRange[1].toString())
    }, [budgetRange])

    // Conditionally show tabs based on user role
    const availableTabs = useMemo(() => {
        if (userRole === 'SELLER') {
            return [
                { id: 'JOB', label: 'Jobs' },
                { id: 'PRODUCT', label: 'Products' }
            ]
        }
        return [
            { id: 'ALL', label: 'All' },
            { id: 'SERVICE', label: 'Services' },
            { id: 'PRODUCT', label: 'Products' }
        ]
    }, [userRole])

    useEffect(() => {
        if (activeTab === 'PRODUCT' || activeTab === 'JOB') {
            setMaxDeliveryTime('any')
        }
    }, [activeTab])

    // Reset activeTab if it's no longer available (e.g. after workspace switch)
    useEffect(() => {
        const isTabAvailable = availableTabs.some(t => t.id === activeTab);
        if (!isTabAvailable) {
            setActiveTab(availableTabs[0]?.id as ItemType || 'ALL');
        }
    }, [userRole, availableTabs, activeTab])







    // Staged filter state (for the "Apply" pattern)
    const [stagedCategories, setStagedCategories] = useState<string[]>([])
    const [stagedBudgetRange, setStagedBudgetRange] = useState<[number, number]>([priceRange.min, priceRange.max])
    const [stagedDeliveryTime, setStagedDeliveryTime] = useState<string>('any')
    const [stagedSortBy, setStagedSortBy] = useState<SortOption>('recommended')

    // Filter and sort items
    const filteredItems = useMemo(() => {
        // Exclude profiles from the main grid results
        let result = initialItems.filter(item => item.type !== 'PROFILE')

        // Type filter
        if (activeTab === 'ALL') {
            // For BUYER, show both. For SELLER, services are hidden by requirements (only jobs and products)
            // However, for SELLER we shouldn't even show the ALL tab or it should only show what's allowed.
            result = result.filter(item => {
                if (userRole === 'SELLER') {
                    return item.type === 'PRODUCT' || item.type === 'JOB';
                }
                return item.type === 'SERVICE' || item.type === 'PRODUCT';
            });
        } else {
            result = result.filter(item => item.type === activeTab)
        }

        // Final safety filters based on role
        if (userRole === 'SELLER') {
            result = result.filter(item => item.type !== 'SERVICE');
        } else {
            // BUYER role: hide jobs from explore
            result = result.filter(item => item.type !== 'JOB');
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.seller.username?.toLowerCase().includes(query) ||
                item.skills?.some(skill => skill.toLowerCase().includes(query))
            )
        }

        // Category filter
        if (selectedCategories.length > 0) {
            result = result.filter(item => selectedCategories.includes(item.category))
        }

        // Budget filter
        result = result.filter(item =>
            item.price >= budgetRange[0] && item.price <= budgetRange[1]
        )

        // Delivery time filter (When active, show only services that meet the criteria)
        // Delivery time filter (When active, show only services that meet the criteria)
        if (maxDeliveryTime !== 'any') {
            result = result.filter(item => {
                // Products and Jobs are hidden when a delivery time filter is active
                if (item.type !== 'SERVICE') return false

                const filterHours = maxDeliveryTime === '24h' ? 24 : maxDeliveryTime === '3d' ? 72 : 168
                const itemHours = Number(item.deliveryTime)

                return !isNaN(itemHours) && itemHours > 0 && itemHours <= filterHours
            })
        }

        // Sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
            case 'price_low':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price_high':
                result.sort((a, b) => b.price - a.price)
                break
            case 'rating':
                result.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
                break
            case 'recommended':
            default:
                // Mix of rating and recency
                result.sort((a, b) => {
                    const scoreA = (a.avgRating ?? 0) * 0.6 + ((a.reviewCount ?? 0) > 0 ? 0.4 : 0)
                    const scoreB = (b.avgRating ?? 0) * 0.6 + ((b.reviewCount ?? 0) > 0 ? 0.4 : 0)
                    return scoreB - scoreA
                })
        }

        return result
    }, [initialItems, activeTab, searchQuery, selectedCategories, budgetRange, maxDeliveryTime, sortBy])

    // Category toggle
    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("")
        setSelectedCategories([])
        setBudgetRange([priceRange.min, priceRange.max])
        setMaxDeliveryTime('any')
        setSortBy('recommended')
    }

    const hasActiveFilters = searchQuery || selectedCategories.length > 0 ||
        budgetRange[0] !== priceRange.min || budgetRange[1] !== priceRange.max ||
        maxDeliveryTime !== 'any'

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedCategories.length > 0) count += selectedCategories.length;
        if (budgetRange[0] !== priceRange.min || budgetRange[1] !== priceRange.max) count += 1;
        if (maxDeliveryTime !== 'any') count += 1;
        return count;
    }, [selectedCategories, budgetRange, maxDeliveryTime, priceRange]);



    // Filter sidebar content (uses staged state)
    const FilterContent = () => {
        const toggleStagedCategory = (category: string) => {
            setStagedCategories(prev =>
                prev.includes(category)
                    ? prev.filter(c => c !== category)
                    : [...prev, category]
            );
        };

        return (
            <div className="space-y-8 pb-8">
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Category</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.length > 0 ? categories.map((category) => {
                            const isActive = stagedCategories.includes(category);
                            return (
                                <button
                                    key={category}
                                    onClick={() => toggleStagedCategory(category)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold rounded-xl transition-all border shadow-sm",
                                        isActive
                                            ? "bg-slate-900 border-slate-900 text-white"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {category}
                                </button>
                            );
                        }) : (
                            <p className="text-[11px] text-slate-400 font-medium">No categories available</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Budget</h3>
                        <div className="flex gap-2 items-center text-slate-900">
                            <Price amount={stagedBudgetRange[0]} size="sm" className="font-bold" />
                            <span className="text-slate-300">—</span>
                            <Price amount={stagedBudgetRange[1]} size="sm" className="font-bold" />
                        </div>
                    </div>
                    <div className="px-1 pt-2">
                        <Slider
                            value={stagedBudgetRange}
                            onValueChange={(value) => setStagedBudgetRange(value as [number, number])}
                            min={priceRange.min}
                            max={priceRange.max}
                            step={10}
                            className="w-full"
                        />
                    </div>
                </div>

                {(activeTab === 'ALL' || activeTab === 'SERVICE') && (
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Delivery Time</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: '24 hours', value: '24h' },
                                { label: '3 days', value: '3d' },
                                { label: '7 days', value: '7d' },
                                { label: 'Any time', value: 'any' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setStagedDeliveryTime(option.value)}
                                    className={cn(
                                        "flex items-center justify-center px-3 py-3 rounded-xl text-xs font-bold transition-all border",
                                        stagedDeliveryTime === option.value
                                            ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Sort By</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { label: 'Recommended', value: 'recommended' },
                            { label: 'Newest First', value: 'newest' },
                            { label: 'Price: Low to High', value: 'price_low' },
                            { label: 'Price: High to Low', value: 'price_high' },
                            { label: 'Top Rated', value: 'rating' }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setStagedSortBy(option.value as SortOption)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                                    stagedSortBy === option.value
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                                )}
                            >
                                {option.label}
                                {stagedSortBy === option.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("min-h-screen", isDashboard && "max-w-none")} style={{ backgroundColor: '#f9f9f9ff' }}>
            {/* Toolbar — Clean & Sticky */}
            <div className={cn("sticky top-0 z-30 backdrop-blur-md border-b border-slate-200/50 flex flex-col", isDashboard ? "px-6 py-4 pb-0" : "px-8 py-6 pb-0")} style={{ backgroundColor: 'rgba(249, 249, 249, 0.9)' }}>
                <div className={cn("flex flex-col gap-4 w-full mb-2", !isDashboard && "max-w-7xl mx-auto")}>
                    {/* Search Bar Row with Filter Button */}
                    <div className="flex gap-3 w-full">
                        <div className="relative flex items-center h-12 rounded-2xl border border-slate-200 bg-white px-4 transition-all focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5 shadow-sm flex-1">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <Input
                                type="text"
                                placeholder="Search by title, category or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-3 text-sm placeholder:text-slate-400 h-full font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="p-1 px-2 text-slate-400 hover:text-slate-900 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Button — Persistent Next to Search */}
                        <Sheet open={isFilterOpen} onOpenChange={(open) => {
                            if (open) {
                                // Initialize staged state when opening
                                setStagedCategories(selectedCategories);
                                setStagedBudgetRange(budgetRange);
                                setStagedDeliveryTime(maxDeliveryTime);
                                setStagedSortBy(sortBy);
                            }
                            setIsFilterOpen(open);
                        }}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative shrink-0 h-12 px-6 rounded-2xl border-slate-200 bg-white font-bold text-slate-600 gap-3 shadow-sm hover:bg-slate-50 transition-all">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>Filter</span>
                                    {activeFiltersCount > 0 && (
                                        <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-900 text-[10px] font-black text-white ml-1">
                                            {activeFiltersCount}
                                        </div>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[320px] md:w-[400px] p-0 bg-white border-l border-slate-100 flex flex-col h-full">
                                <SheetHeader className="p-8 pb-4 border-b border-slate-50 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                            <SlidersHorizontal className="w-5 h-5 text-white" />
                                        </div>
                                        <SheetTitle className="text-xl font-black text-slate-900">Filters</SheetTitle>
                                    </div>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                    <FilterContent />
                                </div>
                                <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3 shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setStagedCategories([]);
                                            setStagedBudgetRange([priceRange.min, priceRange.max]);
                                            setStagedDeliveryTime('any');
                                            setStagedSortBy('recommended');
                                        }}
                                        className="flex-1 h-12 rounded-xl font-bold bg-white"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedCategories(stagedCategories);
                                            setBudgetRange(stagedBudgetRange);
                                            setMaxDeliveryTime(stagedDeliveryTime);
                                            setSortBy(stagedSortBy);
                                            setIsFilterOpen(false);
                                        }}
                                        className="flex-[2] h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
                        {/* Navigation Pills */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 rounded-2xl w-fit">
                            {availableTabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as ItemType)}
                                        className={cn(
                                            "relative px-5 py-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                            isActive ? "text-slate-900 bg-white shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>


                    </div>
                </div>
            </div>

            {/* Content Layout */}
            <div className={cn(
                "flex gap-10 w-full",
                isDashboard ? "px-6 py-6" : "max-w-7xl mx-auto px-6 py-6"
            )}>


                {/* Results Grid */}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        {filteredItems.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6 shadow-inner">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-2">No results found</h2>
                                <p className="text-slate-500 font-medium max-w-xs mb-8">
                                    We couldn't find any items matching your current filters.
                                </p>
                                <Button onClick={clearFilters} variant="outline" className="rounded-xl font-bold h-11 px-8 border-slate-200 hover:bg-slate-50">
                                    Clear all filters
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8",
                                    isDashboard ? "w-full" : "max-w-7xl mx-auto"
                                )}
                            >
                                {filteredItems.map((item, index) => (
                                    <ExploreCard
                                        key={`${item.type}-${item.id}`}
                                        item={item}
                                        index={index}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}

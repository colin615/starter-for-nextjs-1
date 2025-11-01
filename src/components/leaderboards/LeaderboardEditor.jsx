"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Save,
    ArrowLeft,
    Trash2,
    Info,
    Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RainbowButton } from "../ui/rainbow-button";
import { HiBolt } from "react-icons/hi2";
import { showToast } from "@/components/ui/toast";
import { getAvatarUrl } from "@/utils/avatarUtils";
import { supabase } from "@/lib/supabase";
import { StripedPattern } from "../magicui/striped-pattern";

const STEPS = [
    { id: 1, name: "Details", title: "Leaderboard Details" },
    { id: 2, name: "Appearance", title: "Appearance" },
    { id: 3, name: "Prizes", title: "Prize Distribution" },
    { id: 4, name: "Confirm", title: "Confirm & Deploy" },
];

const DRAFT_STORAGE_KEY = "leaderboard_draft";

export function LeaderboardEditor() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [casinos, setCasinos] = useState([]);
    const [isCasinosLoading, setIsCasinosLoading] = useState(true);
    const [rawInputs, setRawInputs] = useState({}); // Store raw input values while typing

    const [formData, setFormData] = useState(() => {
        // Load draft from localStorage if available
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return parsed;
                } catch (e) {
                    console.error("Failed to load draft:", e);
                }
            }
        }
        return {
            title: "",
            casinoId: "",
            name: "",
            description: "",
            type: "",
            startDate: "",
            startTime: "00:00",
            endDate: "",
            endTime: "23:59",
            showAvatars: true,
            showBadges: true,
            avatarType: "dicebear",
            prizes: [
                { rank: 1, prize: "", type: "percentage" },
                { rank: 2, prize: "", type: "percentage" },
                { rank: 3, prize: "", type: "percentage" },
            ],
            prizePool: "$1,000",
            distributionType: "percentage",
            numWinners: 3,
            currency: "USD",
        };
    });

    // Currency configuration
    const currencies = {
        USD: { symbol: "$", code: "USD", name: "US Dollar" },
        EUR: { symbol: "€", code: "EUR", name: "Euro" },
        GBP: { symbol: "£", code: "GBP", name: "British Pound" },
        CAD: { symbol: "C$", code: "CAD", name: "Canadian Dollar" },
        AUD: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
        JPY: { symbol: "¥", code: "JPY", name: "Japanese Yen" },
        BTC: { symbol: "₿", code: "BTC", name: "Bitcoin" },
        ETH: { symbol: "Ξ", code: "ETH", name: "Ethereum" },
    };

    // Format currency value based on selected currency
    const formatCurrency = (value, currencyCode) => {
        const code = currencyCode || formData.currency || "USD";
        if (!value || value === "") return "";
        const numValue = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value;
        if (isNaN(numValue)) return "";
        
        const currency = currencies[code] || currencies.USD;
        
        // For crypto currencies, use different formatting
        if (code === "BTC" || code === "ETH") {
            return `${currency.symbol}${numValue.toLocaleString("en-US", {
                minimumFractionDigits: 4,
                maximumFractionDigits: 8,
            })}`;
        }
        
        // For JPY, no decimal places
        if (code === "JPY") {
            return `${currency.symbol}${Math.round(numValue).toLocaleString("en-US")}`;
        }
        
        // For other currencies, use standard formatting
        return `${currency.symbol}${numValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Parse currency value (remove symbol and return number)
    const parseCurrency = (value) => {
        if (!value) return 0;
        const cleaned = value.toString().replace(/[^\d.-]/g, "");
        return parseFloat(cleaned) || 0;
    };

    useEffect(() => {
        // Fetch casinos from services
        fetch("/api/services/link")
            .then((res) => res.json())
            .then((data) => {
                setCasinos(
                    data.services.map((service) => ({
                        id: service.identifier,
                        name: service.name,
                        accentColor: service.accent_color,
                        icon: service.icon,
                        iconClass: service.iconClass,
                    }))
                );
            })
            .catch((err) => console.error("Failed to fetch casinos:", err))
            .finally(() => setIsCasinosLoading(false));
    }, []);

    // Ensure end datetime is always after start datetime
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const startDateTime = formData.startTime 
                ? `${formData.startDate}T${formData.startTime}`
                : `${formData.startDate}T00:00`;
            const endDateTime = formData.endTime 
                ? `${formData.endDate}T${formData.endTime}`
                : `${formData.endDate}T23:59`;
            
            if (new Date(startDateTime) >= new Date(endDateTime)) {
                setFormData((prev) => ({
                    ...prev,
                    endDate: "",
                    endTime: "",
                }));
                setHasUnsavedChanges(true);
            }
        }
    }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

    // Reformat prize pool when currency changes
    useEffect(() => {
        if (formData.prizePool && formData.currency) {
            const parsedValue = parseCurrency(formData.prizePool);
            if (parsedValue > 0) {
                const formatted = formatCurrency(parsedValue, formData.currency);
                setFormData((prev) => {
                    // Only update if the formatted value is different to avoid infinite loops
                    if (prev.prizePool !== formatted) {
                        return {
                            ...prev,
                            prizePool: formatted,
                        };
                    }
                    return prev;
                });
                // Clear raw inputs when currency changes
                setRawInputs((prev) => {
                    const newState = { ...prev };
                    delete newState.prizePool;
                    return newState;
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.currency]);

    // Helper function to get casino full name
    const getCasinoFullName = (casinoName) => {
        if (!casinoName) return "";
        return `${casinoName} Casino`;
    };

    // Helper function to process variables in any text field
    const processVariables = (text, prizePool, casinoName) => {
        if (!text) return text;
        let processed = text;
        if (prizePool) {
            // Handle [prizepool.uppercase] first, then [prizepool]
            processed = processed.replace(/\[prizepool\.uppercase\]/gi, prizePool.toUpperCase());
            processed = processed.replace(/\[prizepool\]/gi, prizePool);
        }
        if (casinoName) {
            const casinoFullName = getCasinoFullName(casinoName);
            // Handle casino.name variants - uppercase first, then regular
            processed = processed.replace(/\[casino\.name\.uppercase\]/gi, casinoName.toUpperCase());
            processed = processed.replace(/\[casino\.name\]/gi, casinoName);
            // Handle casino.fullname variants - uppercase first, then regular
            processed = processed.replace(/\[casino\.fullname\.uppercase\]/gi, casinoFullName.toUpperCase());
            processed = processed.replace(/\[casino\.fullname\]/gi, casinoFullName);
        }
        return processed;
    };

    // Helper function to highlight variables in text
    const highlightVariables = (text) => {
        if (!text) return [];
        const parts = [];
        const variableRegex = /\[([^\]]+)\]/g;
        let lastIndex = 0;
        let match;

        while ((match = variableRegex.exec(text)) !== null) {
            // Add text before the variable
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: text.substring(lastIndex, match.index),
                });
            }
            // Add the variable
            parts.push({
                type: 'variable',
                content: match[0],
            });
            lastIndex = match.index + match[0].length;
        }
        // Add remaining text
        if (lastIndex < text.length) {
            parts.push({
                type: 'text',
                content: text.substring(lastIndex),
            });
        }
        return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    };

    // Copy variable to clipboard
    const copyVariable = async (variable) => {
        try {
            await navigator.clipboard.writeText(variable);
            showToast({
                title: "Copied!",
                description: `${variable} copied to clipboard`,
                variant: "success",
            });
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    // Auto-save draft to localStorage
    useEffect(() => {
        if (hasUnsavedChanges) {
            const timer = setTimeout(() => {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
                setLastSaved(new Date());
                setHasUnsavedChanges(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, hasUnsavedChanges]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setHasUnsavedChanges(true);
    };

    const handlePrizeChange = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            prizes: prev.prizes.map((prize, i) =>
                i === index ? { ...prize, [field]: value } : prize
            ),
        }));
        setHasUnsavedChanges(true);
    };

    const addPrizeTier = () => {
        setFormData((prev) => {
            const newRank = prev.prizes.length + 1;
            return {
                ...prev,
                prizes: [
                    ...prev.prizes,
                    { rank: newRank, prize: "", type: "percentage" },
                ],
                numWinners: newRank,
            };
        });
        setHasUnsavedChanges(true);
    };

    const removePrizeTier = (index) => {
        setFormData((prev) => ({
            ...prev,
            prizes: prev.prizes.filter((_, i) => i !== index).map((p, i) => ({ ...p, rank: i + 1 })),
            numWinners: prev.prizes.length - 1,
        }));
        setHasUnsavedChanges(true);
    };

    const handleNumWinnersChange = (value) => {
        const numWinners = Math.min(Math.max(parseInt(value) || 1, 1), 100);
        setFormData((prev) => {
            const currentLength = prev.prizes.length;
            let newPrizes = [...prev.prizes];

            if (numWinners > currentLength) {
                // Add more prize tiers
                for (let i = currentLength; i < numWinners; i++) {
                    newPrizes.push({ rank: i + 1, prize: "", type: "percentage" });
                }
            } else if (numWinners < currentLength) {
                // Remove prize tiers
                newPrizes = newPrizes.slice(0, numWinners).map((p, i) => ({ ...p, rank: i + 1 }));
            }

            return {
                ...prev,
                numWinners,
                prizes: newPrizes,
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            // TODO: Save to backend API
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
            console.error("Failed to save draft:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearDraft = () => {
        // Clear localStorage
        localStorage.removeItem(DRAFT_STORAGE_KEY);

        // Reset form to defaults
        setFormData({
            title: "",
            casinoId: "",
            name: "",
            description: "",
            type: "",
            startDate: "",
            startTime: "00:00",
            endDate: "",
            endTime: "23:59",
            showAvatars: true,
            showBadges: true,
            avatarType: "dicebear",
            prizes: [
                { rank: 1, prize: "", type: "percentage" },
                { rank: 2, prize: "", type: "percentage" },
                { rank: 3, prize: "", type: "percentage" },
            ],
            prizePool: "$1,000",
            distributionType: "percentage",
            numWinners: 3,
            currency: "USD",
        });

        // Reset to step 1
        setCurrentStep(1);
        setDirection(1);
        setHasUnsavedChanges(false);
        setLastSaved(null);
    };

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setDirection(1);
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(currentStep - 1);
        }
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            // Get session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                showToast({
                    title: "Authentication Error",
                    description: "Please log in to create a leaderboard",
                    variant: "error",
                });
                return;
            }

            // Convert dates and times to precise UTC timestamps
            // Combine date and time, defaulting to 00:00 for start and 23:59 for end if time not provided
            const startTime = formData.startTime || "00:00";
            const endTime = formData.endTime || "23:59";
            const startTimestamp = formData.startDate
                ? new Date(`${formData.startDate}T${startTime}:00`).toISOString()
                : null;
            const endTimestamp = formData.endDate
                ? new Date(`${formData.endDate}T${endTime}:59.999`).toISOString()
                : null;


            console.log("startTimestamp", startTimestamp);
            console.log("endTimestamp", endTimestamp);

            // Calculate prize amounts from percentages
            const prizePoolStr = formData.prizePool || "$1,000";
            const totalPrize = parseCurrency(prizePoolStr);
            const prizeAmounts = formData.prizes
                .filter((p) => p.prize)
                .map((prize) => {
                    const percentage = parseFloat(prize.prize) || 0;
                    return totalPrize > 0 ? (percentage / 100) * totalPrize : 0;
                });

            // Call Supabase function
            const { data, error } = await supabase.functions.invoke('leaderboard', {
                body: {
                    userId: session.user.id,
                    jwt: session.access_token,
                    title: formData.title,
                    casinoId: formData.casinoId,
                    name: formData.name,
                    description: formData.description,
                    type: formData.type,
                    startDate: startTimestamp,
                    endDate: endTimestamp,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    showAvatars: formData.showAvatars,
                    showBadges: formData.showBadges,
                    avatarType: formData.avatarType,
                    prizePool: formData.prizePool,
                    currency: formData.currency || "USD",
                    numWinners: formData.numWinners || formData.prizes.length,
                    prizes: formData.prizes.filter((p) => p.prize).map((prize) => ({
                        rank: prize.rank,
                        percentage: parseFloat(prize.prize) || 0,
                        amount: totalPrize > 0 ? ((parseFloat(prize.prize) || 0) / 100) * totalPrize : 0,
                    })),
                    prizeAmounts: prizeAmounts,
                }
            });

            if (error) {
                console.error("Leaderboard creation error:", error);
                showToast({
                    title: "Error",
                    description: error.message || "Failed to create leaderboard",
                    variant: "error",
                });
                return;
            }

            console.log("Leaderboard created:", data);
            showToast({
                title: "Success",
                description: "Leaderboard created successfully",
                variant: "success",
            });
            
            // Clear draft and redirect
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            router.push("/dashboard/leaderboards");
        } catch (error) {
            console.error("Unexpected error:", error);
            showToast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "error",
            });
        } finally {
            setIsConfirming(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // TODO: Implement leaderboard creation logic
            console.log("Creating leaderboard:", formData);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            router.push("/dashboard/leaderboards");
        } catch (error) {
            console.error("Failed to create leaderboard:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.title && formData.casinoId && formData.type && formData.startDate && formData.startTime && formData.endDate && formData.endTime;
            case 2:
                return true;
            case 3:
                return true;
            case 4:
                return true;
            default:
                return false;
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            wager_race: "Wager Race",
            raffle: "Raffle Leaderboard",
        };
        return labels[type] || type;
    };


    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 z-[1] relative">
                        <div className="space-y-2">
                            <Label htmlFor="title">Leaderboard Title</Label>
                            <div className="relative">
                                <Input
                                    
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange("title", e.target.value)}
                                    placeholder=""
                                    required
                                    className={cn(
                                        "relative z-10 !bg-[#17191D]" ,
                                        formData.title && highlightVariables(formData.title).some(p => p.type === 'variable') && "text-transparent caret-foreground"
                                    )}
                                />
                                {formData.title && highlightVariables(formData.title).some(p => p.type === 'variable') && (
                                    <div
                                        className="absolute inset-0 pointer-events-none flex items-center px-3 py-1 text-base md:text-sm whitespace-pre"
                                        aria-hidden="true"
                                    >
                                        {highlightVariables(formData.title).map((part, idx) => (
                                            <span
                                                key={idx}
                                                className={cn(
                                                    part.type === 'variable' ? "text-[#8BFF4D]" : "text-foreground"
                                                )}
                                            >
                                                {part.content}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="casino">Casino</Label>
                            {isCasinosLoading ? (
                                <div className="text-sm text-muted-foreground">Loading casinos...</div>
                            ) : (
                                <Select
                                    value={formData.casinoId}
                                    onValueChange={(value) => handleInputChange("casinoId", value)}
                                >
                                    <SelectTrigger id="casino" className="w-full !bg-[#17191D]">
                                        <SelectValue placeholder="Select a casino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {casinos.map((casino) => (
                                            <SelectItem key={casino.id} value={casino.id}>
                                                <div className="flex items-center gap-2">
                                                    {casino.id === "shuffle" ? (
                                                        <div
                                                            className="w-5 h-5"
                                                            style={{
                                                                backgroundColor: "#7717FF",
                                                                maskImage: `url(/casinos/${casino.id}.svg)`,
                                                                maskSize: "contain",
                                                                maskRepeat: "no-repeat",
                                                                maskPosition: "center",
                                                                WebkitMaskImage: `url(/casinos/${casino.id}.svg)`,
                                                                WebkitMaskSize: "contain",
                                                                WebkitMaskRepeat: "no-repeat",
                                                                WebkitMaskPosition: "center",
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={`/casinos/${casino.id}.svg`}
                                                            alt={casino.name}
                                                            className="w-5 h-5"
                                                        />
                                                    )}
                                                    <span>{casino.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leaderboardType">Leaderboard Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleInputChange("type", value)}
                            >
                                <SelectTrigger id="leaderboardType" className="w-full !bg-[#17191D]">
                                    <SelectValue placeholder="Select a leaderboard type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wager_race">Wager Race</SelectItem>
                                    <SelectItem value="raffle" disabled>
                                        Raffle Leaderboard
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                                    required
                                    className="!bg-[#17191D] date-time-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                                    required
                                    className="!bg-[#17191D] date-time-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                                    min={formData.startDate || undefined}
                                    required
                                    className="!bg-[#17191D] date-time-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                                    required
                                    className="!bg-[#17191D] date-time-input"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                // Generate preview avatars with seed "test"
                const testSeed = "test";
                const dicebearPreview = getAvatarUrl("dicebear", "acb", "cva");
                const dicebearLoreleiPreview = getAvatarUrl("dicebear-lorelei", "ab", "ba");
                const dicebearBigSmilePreview = getAvatarUrl("dicebear-bigsmile", "vdb", "bd");
                const supabasePreview = getAvatarUrl("supabase", testSeed, testSeed);

                const avatarOptions = [
                    { type: "supabase", label: "Slot Characters", preview: supabasePreview },
                    { type: "dicebear", label: "Adventurer", preview: dicebearPreview },
                    { type: "dicebear-lorelei", label: "Lorelei", preview: dicebearLoreleiPreview },
                    { type: "dicebear-bigsmile", label: "Big Smile", preview: dicebearBigSmilePreview },
                ];

                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="avatarType">Avatar Style</Label>
                            <Select
                                value={formData.avatarType}
                                onValueChange={(value) => handleInputChange("avatarType", value)}
                            >
                                <SelectTrigger id="avatarType" className="w-full !bg-[#17191D]">
                                    <SelectValue>
                                        {formData.avatarType ? (
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 rounded-full overflow-hidden">
                                                    {avatarOptions.find(opt => opt.type === formData.avatarType)?.preview && (
                                                        <img
                                                            src={avatarOptions.find(opt => opt.type === formData.avatarType).preview}
                                                            alt={`${avatarOptions.find(opt => opt.type === formData.avatarType).label} Avatar`}
                                                            className="w-full h-full  object-cover"
                                                            onError={(e) => {
                                                                e.target.src = dicebearPreview || "";
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <span>{avatarOptions.find(opt => opt.type === formData.avatarType)?.label}</span>
                                            </div>
                                        ) : (
                                            "Select an avatar style"
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {avatarOptions.map((option) => (
                                        <SelectItem key={option.type} value={option.type}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                                    {option.preview && (
                                                        <img
                                                            src={option.preview}
                                                            alt={`${option.label} Avatar`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.src = dicebearPreview || "";
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <span>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Display Options section hidden for now */}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="prizePool">Total Prize Pool</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="prizePool"
                                    type="text"
                                    value={rawInputs.prizePool !== undefined ? rawInputs.prizePool : formData.prizePool}
                                    onChange={(e) => {
                                        setRawInputs((prev) => ({ ...prev, prizePool: e.target.value }));
                                        handleInputChange("prizePool", e.target.value);
                                    }}
                                    onFocus={(e) => {
                                        const raw = parseCurrency(e.target.value).toString();
                                        setRawInputs((prev) => ({ ...prev, prizePool: raw }));
                                    }}
                                    onBlur={(e) => {
                                        const parsed = parseCurrency(e.target.value);
                                        if (parsed > 0) {
                                            const formatted = formatCurrency(parsed, formData.currency);
                                            handleInputChange("prizePool", formatted);
                                        }
                                        setRawInputs((prev) => {
                                            const newState = { ...prev };
                                            delete newState.prizePool;
                                            return newState;
                                        });
                                    }}
                                    placeholder={formatCurrency(1000)}
                                    className="!bg-[#17191D] flex-1"
                                />
                                <Select
                                    value={formData.currency || "USD"}
                                    onValueChange={(value) => handleInputChange("currency", value)}
                                >
                                    <SelectTrigger className="w-[140px] !bg-[#17191D]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(currencies).map((currency) => (
                                            <SelectItem key={currency.code} value={currency.code}>
                                                {currency.symbol} {currency.code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Total amount to be distributed among winners.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="numWinners">Amount of Winners</Label>
                            <Input
                                id="numWinners"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.numWinners || formData.prizes.length}
                                onChange={(e) => handleNumWinnersChange(e.target.value)}
                                placeholder="3"
                                className="!bg-[#17191D]"
                            />
                            <p className="text-sm text-muted-foreground">
                                Number of prize winners (max 100). This will automatically adjust the number of prize tiers.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Prize Tiers</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addPrizeTier}
                                >
                                    Add Tier
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.prizes.map((prize, index) => {
                                    // Calculate prize pool amount
                                    const prizePoolStr = formData.prizePool || formatCurrency(1000);
                                    const totalPrize = parseCurrency(prizePoolStr);
                                    
                                    // Get current percentage value (always stored as percentage)
                                    const prizePercentage = parseFloat(prize.prize) || 0;
                                    const prizeAmount = totalPrize > 0 ? (prizePercentage / 100) * totalPrize : 0;
                                    const currencySymbol = currencies[formData.currency || "USD"]?.symbol || "$";

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 border rounded-md"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                                                #{prize.rank}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Amount ({currencySymbol})</Label>
                                                    <Input
                                                        type="text"
                                                        value={rawInputs[`prizeAmount-${index}`] !== undefined 
                                                            ? rawInputs[`prizeAmount-${index}`]
                                                            : (prizeAmount > 0 ? formatCurrency(prizeAmount, formData.currency) : "")
                                                        }
                                                        onChange={(e) => {
                                                            const inputValue = e.target.value;
                                                            setRawInputs((prev) => ({ ...prev, [`prizeAmount-${index}`]: inputValue }));
                                                        }}
                                                        onFocus={(e) => {
                                                            const raw = prizeAmount > 0 ? prizeAmount.toString() : "";
                                                            setRawInputs((prev) => ({ ...prev, [`prizeAmount-${index}`]: raw }));
                                                        }}
                                                        onBlur={(e) => {
                                                            const dollarValue = parseCurrency(e.target.value);
                                                            if (dollarValue > 0) {
                                                                // Store percentage with high precision (8 decimals) to avoid rounding errors
                                                                const percentageValue = totalPrize > 0 ? (dollarValue / totalPrize) * 100 : 0;
                                                                handlePrizeChange(index, "prize", percentageValue.toFixed(8));
                                                            }
                                                            setRawInputs((prev) => {
                                                                const newState = { ...prev };
                                                                delete newState[`prizeAmount-${index}`];
                                                                return newState;
                                                            });
                                                        }}
                                                        placeholder="0.00"
                                                        className="!bg-[#17191D]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={prizePercentage ? parseFloat(prizePercentage).toFixed(2) : ""}
                                                        onChange={(e) => {
                                                            const percentageValue = parseFloat(e.target.value) || 0;
                                                            // Store with high precision (8 decimals) for accurate amount calculation
                                                            handlePrizeChange(index, "prize", percentageValue.toFixed(8));
                                                        }}
                                                        placeholder="0.00"
                                                        className="!bg-[#17191D]"
                                                        tabIndex="-1"
                                                    />
                                                </div>
                                            </div>
                                            {formData.prizes.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removePrizeTier(index)}
                                                    tabIndex="-1"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                const configuredPrizes = formData.prizes.filter((p) => p.prize);
                // Calculate prize pool amount for display
                const prizePoolStr = formData.prizePool || formatCurrency(1000);
                const totalPrize = parseCurrency(prizePoolStr);
                
                return (
                    <div className="flex flex-col items-center justify-center min-h-full py-12">
                        <div className="w-full max-w-2xl space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Review Your Leaderboard</h2>
                                <p className="text-muted-foreground">
                                    Please review the details below before deploying
                                </p>
                            </div>

                            <div className="space-y-6 bg-muted/30 rounded-lg p-6 border">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg border-b pb-2">Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Title:</span>
                                            <p className="font-medium">
                                                {formData.title
                                                    ? processVariables(
                                                        formData.title,
                                                        formData.prizePool || "",
                                                        casinos.find((c) => c.id === formData.casinoId)?.name || ""
                                                    )
                                                    : "Not set"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Casino:</span>
                                            <p className="font-medium">
                                                {casinos.find((c) => c.id === formData.casinoId)?.name || "Not set"}
                                            </p>
                                        </div>
                                        {formData.startDate && (
                                            <div>
                                                <span className="text-muted-foreground">Start Date & Time:</span>
                                                <p className="font-medium">
                                                    {new Date(`${formData.startDate}T${formData.startTime || "00:00"}`).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {formData.endDate && (
                                            <div>
                                                <span className="text-muted-foreground">End Date & Time:</span>
                                                <p className="font-medium">
                                                    {new Date(`${formData.endDate}T${formData.endTime || "23:59"}`).toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {formData.description && (
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground">Description:</span>
                                                <p className="font-medium mt-1">{formData.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg border-b pb-2">Appearance</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="col-span-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Avatar Style:</span>
                                                <span className="font-medium">
                                                    {formData.avatarType === "dicebear" ? "Adventurer" :
                                                        formData.avatarType === "dicebear-lorelei" ? "Lorelei" :
                                                            formData.avatarType === "dicebear-bigsmile" ? "Big Smile" :
                                                                formData.avatarType === "supabase" ? "Supabase" :
                                                                    "Adventurer"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Show Badges:</span>
                                                <span className="font-medium">{formData.showBadges ? "Yes" : "No"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {configuredPrizes.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg border-b pb-2">Prize Distribution</h3>
                                        <div className="space-y-2 text-sm">
                                            {formData.prizePool && (
                                                <div>
                                                    <span className="text-muted-foreground">Prize Pool:</span>
                                                    <p className="font-medium">{formData.prizePool}</p>
                                                </div>
                                            )}
                                            <div className="mt-3 space-y-2">
                                                <span className="text-muted-foreground">Prize Tiers:</span>
                                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                                    {configuredPrizes.map((prize, index) => {
                                                        // Calculate dollar amount from percentage
                                                        const prizePercentage = parseFloat(prize.prize) || 0;
                                                        const prizeAmount = totalPrize > 0 ? (prizePercentage / 100) * totalPrize : 0;
                                                        
                                                        return (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3 p-2 bg-background rounded border"
                                                            >
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs">
                                                                    #{prize.rank}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span className="font-medium">
                                                                        {prizeAmount > 0 ? formatCurrency(prizeAmount, formData.currency) : "—"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center pt-4">
                                <RainbowButton
                                    type="button"
                                    className="!bg-[#17181D]"
                                    disabled={isConfirming}
                                    onClick={handleConfirm}
                                >
                                    <HiBolt className="size-4" /> {isConfirming ? "Creating..." : "Deploy Leaderboard"}
                                </RainbowButton>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };


    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Top Toolbar */}
            <div className="flex-shrink-0 border-b bg-card">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/dashboard/leaderboards")}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-lg font-semibold">Create Leaderboard</h1>
                        {hasUnsavedChanges && (
                            <span className="text-xs text-muted-foreground">• Unsaved changes</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="text-xs text-muted-foreground">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearDraft}
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Draft"}
                        </Button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pb-3">
                    <div className="flex items-center gap-2">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div
                                            className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs border transition-all duration-200 cursor-pointer",
                                                currentStep > step.id
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : currentStep === step.id
                                                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-110"
                                                        : "bg-background text-muted-foreground border-muted"
                                            )}
                                            onClick={() => {
                                                if (currentStep > step.id || canProceed()) {
                                                    setDirection(currentStep > step.id ? -1 : 1);
                                                    setCurrentStep(step.id);
                                                }
                                            }}
                                        >
                                            {currentStep > step.id ? (
                                                <Check className="w-3.5 h-3.5" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                                currentStep >= step.id
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {step.name}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={cn(
                                                "h-px flex-1 mx-2 transition-all duration-300",
                                                currentStep > step.id ? "bg-primary" : "bg-muted"
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative pt-5">
                <StripedPattern className="opacity-[0.04] text-foreground !z-0" />
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-[1]">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="relative min-h-full max-w-2xl mx-auto">
                            <div
                                key={`${currentStep}-${direction}`}
                                className={cn(
                                    "step-transition",
                                    direction === 1 ? "step-slide-right" : "step-slide-left"
                                )}
                            >
                                <h3 className="text-lg font-semibold mb-4">
                                    {STEPS[currentStep - 1].title}
                                </h3>
                                {renderStepContent()}
                            </div>
                        </div>
                    </div>

                    {currentStep !== 4 && (
                        <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t flex gap-3 justify-center bg-card">
                            <div className="flex gap-3">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
                                        variant="popout"
                                        onClick={handlePrevious}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                )}
                                {currentStep < STEPS.length - 1 ? (
                                    <Button
                                        type="button"
                                        className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
                                        variant="popout"
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
                                        variant="popout"
                                        onClick={handleNext}
                                        disabled={!canProceed()}
                                    >
                                        Review
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    {currentStep === 4 && (
                        <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t flex gap-3 justify-center bg-card">
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
                                    variant="popout"
                                    onClick={handlePrevious}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}


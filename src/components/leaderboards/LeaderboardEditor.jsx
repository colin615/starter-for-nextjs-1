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
        };
    });

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
                    { rank: newRank, prize: "", type: prev.distributionType },
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

    // Generate distribution using the provided formula
    const generateDistribution = (totalPrize, numWinners) => {
        // Calculate dynamic minimum prize based on total prize pool
        // Formula: 0.5% to 1% of total, with minimum of $10 and rounding to nearest $10
        // Examples: $1,000 → $10 min, $8,000 → $50 min, $10,000 → $50-100 min
        const minPrizePercentage = totalPrize < 2000 ? 0.01 : 0.00625; // 1% for small pools, 0.625% for larger
        let minPrize = Math.round((totalPrize * minPrizePercentage) / 10) * 10; // Round to nearest $10
        minPrize = Math.max(10, minPrize); // Ensure minimum of $10

        // Round increment based on prize pool size
        const roundIncrement = totalPrize < 2000 ? 10 : 50; // $10 increments for small pools, $50 for larger

        // If minimum total exceeds prize pool, distribute evenly
        if (minPrize * numWinners > totalPrize) {
            const evenPrize = Math.floor(totalPrize / numWinners);
            const remainder = totalPrize - (evenPrize * numWinners);
            const prizes = Array(numWinners).fill(evenPrize);
            prizes[numWinners - 1] += remainder; // Add remainder to last place
            return prizes.map(p => Math.round(p / roundIncrement) * roundIncrement);
        }

        // Step 1: Base weight curve (exponential decay) - adjusted to give more to first place
        const decay = 0.65; // controls how fast it drops (lower = slower decay = bigger first prize)
        const weights = Array.from({ length: numWinners }, (_, i) => Math.pow(decay, i));

        // Step 2: Normalize
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        // Step 3: Calculate prizes
        let prizes = weights.map(w => (w / totalWeight) * totalPrize);

        // Step 4: Round to nearest increment and ensure minimum
        prizes = prizes.map(p => {
            const rounded = Math.round(p / roundIncrement) * roundIncrement;
            return Math.max(rounded, minPrize);
        });

        // Step 5: Adjust to match total exactly
        let currentTotal = prizes.reduce((a, b) => a + b, 0);
        let diff = totalPrize - currentTotal;

        // If we're over, reduce from top prizes (but keep minimums)
        if (diff < 0) {
            let toReduce = Math.abs(diff);
            for (let i = 0; i < prizes.length && toReduce > 0; i++) {
                const maxReduction = prizes[i] - minPrize;
                if (maxReduction > 0) {
                    const reduction = Math.min(toReduce, maxReduction);
                    const roundedReduction = Math.round(reduction / roundIncrement) * roundIncrement;
                    prizes[i] = Math.max(minPrize, prizes[i] - roundedReduction);
                    toReduce -= roundedReduction;
                }
            }
        }

        // Recalculate total after reductions
        currentTotal = prizes.reduce((a, b) => a + b, 0);
        diff = totalPrize - currentTotal;

        // If we're under, add to top prizes in increments
        if (diff > 0) {
            const roundedDiff = Math.round(diff / roundIncrement) * roundIncrement;
            let remaining = roundedDiff;
            for (let i = 0; i < prizes.length && remaining > 0; i++) {
                const add = Math.min(remaining, roundIncrement);
                prizes[i] += add;
                remaining -= add;
            }
            // Add any remainder to first place
            prizes[0] += remaining;
        }

        // Final round to nearest increment and ensure minimums
        prizes = prizes.map(p => {
            const rounded = Math.round(p / roundIncrement) * roundIncrement;
            return Math.max(rounded, minPrize);
        });

        // Final adjustment to match total exactly
        currentTotal = prizes.reduce((a, b) => a + b, 0);
        diff = totalPrize - currentTotal;
        if (diff !== 0) {
            prizes[0] += diff;
            prizes[0] = Math.round(prizes[0] / roundIncrement) * roundIncrement;
            prizes[0] = Math.max(prizes[0], minPrize);
        }

        return prizes;
    };

    const handleNumWinnersChange = (value) => {
        const numWinners = Math.min(Math.max(parseInt(value) || 1, 1), 100);
        setFormData((prev) => {
            const currentLength = prev.prizes.length;
            let newPrizes = [...prev.prizes];

            if (numWinners > currentLength) {
                // Add more prize tiers
                for (let i = currentLength; i < numWinners; i++) {
                    newPrizes.push({ rank: i + 1, prize: "", type: prev.distributionType });
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

    const handleAutoDistribute = () => {
        // Parse prize pool (remove $ and commas, convert to number)
        const prizePoolStr = formData.prizePool || "$1,000";
        const totalPrize = parseFloat(prizePoolStr.replace(/[$,\s]/g, '')) || 1000;

        if (!totalPrize || totalPrize <= 0) {
            showToast({
                title: "Invalid Prize Pool",
                description: "Please enter a valid prize pool amount",
                variant: "error",
            });
            return;
        }

        const numWinners = formData.numWinners || formData.prizes.length;
        if (numWinners < 1 || numWinners > 100) {
            showToast({
                title: "Invalid Number of Winners",
                description: "Number of winners must be between 1 and 100",
                variant: "error",
            });
            return;
        }

        // Generate distribution amounts
        const distributionAmounts = generateDistribution(totalPrize, numWinners);

        // Update prizes based on distribution type
        setFormData((prev) => {
            let updatedPrizes = [...prev.prizes];

            if (distributionAmounts.length !== updatedPrizes.length) {
                // Ensure we have the right number of prizes
                updatedPrizes = Array.from({ length: numWinners }, (_, i) => ({
                    rank: i + 1,
                    prize: "",
                    type: prev.distributionType,
                }));
            }

            if (prev.distributionType === "percentage") {
                // Convert amounts to percentages
                updatedPrizes = updatedPrizes.map((prize, index) => ({
                    ...prize,
                    prize: distributionAmounts[index] && distributionAmounts[index] > 0
                        ? ((distributionAmounts[index] / totalPrize) * 100).toFixed(2)
                        : "",
                }));
            } else {
                // Use amounts directly (ensure we have a value for each prize)
                updatedPrizes = updatedPrizes.map((prize, index) => ({
                    ...prize,
                    prize: distributionAmounts[index] && distributionAmounts[index] > 0
                        ? distributionAmounts[index].toString()
                        : "",
                }));
            }

            return {
                ...prev,
                prizes: updatedPrizes,
            };
        });
        setHasUnsavedChanges(true);

        showToast({
            title: "Distribution Complete",
            description: `Distributed ${totalPrize.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} among ${numWinners} winners`,
            variant: "success",
        });
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

            // Call Supabase function
            const { data, error } = await supabase.functions.invoke('leaderboard', {
                body: {
                    userId: session.user.id,
                    jwt: session.access_token,
                    title: formData.title,
                    casinoId: formData.casinoId,
                    type: formData.type,
                    startDate: startTimestamp,
                    endDate: endTimestamp,
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

                        <div className="space-y-4">
                            <Label>Display Options</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-md">
                                    <div>
                                        <Label htmlFor="showBadges" className="font-normal">
                                            Show Rank Badges
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Display badges for top positions
                                        </p>
                                    </div>
                                    <Switch
                                        id="showBadges"
                                        checked={formData.showBadges}
                                        onCheckedChange={(checked) => handleInputChange("showBadges", checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="prizePool">Total Prize Pool</Label>
                            <Input
                                id="prizePool"
                                type="text"
                                value={formData.prizePool}
                                onChange={(e) => handleInputChange("prizePool", e.target.value)}
                                placeholder="$1,000"
                                className="!bg-[#17191D]"
                            />
                            <p className="text-sm text-muted-foreground">
                                Total amount to be distributed among winners.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="distributionType">Distribution Type</Label>
                            <Select
                                value={formData.distributionType}
                                onValueChange={(value) => handleInputChange("distributionType", value)}
                            >
                                <SelectTrigger id="distributionType" className="w-full !bg-[#17191D]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                            </Select>
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
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAutoDistribute}
                                    >
                                        Auto Distribute
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addPrizeTier}
                                    >
                                        Add Tier
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {formData.prizes.map((prize, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 border rounded-md"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                                            #{prize.rank}
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                value={prize.prize}
                                                onChange={(e) =>
                                                    handlePrizeChange(index, "prize", e.target.value)
                                                }
                                                placeholder={
                                                    formData.distributionType === "percentage"
                                                        ? "Percentage (e.g., 50)"
                                                        : "Amount (e.g., 5000)"
                                                }
                                                className="!bg-[#17191D]"
                                            />
                                        </div>
                                        {formData.prizes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePrizeTier(index)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                const configuredPrizes = formData.prizes.filter((p) => p.prize);
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
                                                    <p className="font-medium">${formData.prizePool}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-muted-foreground">Distribution Type:</span>
                                                <p className="font-medium capitalize">{formData.distributionType}</p>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                <span className="text-muted-foreground">Prize Tiers:</span>
                                                <div className="space-y-2">
                                                    {configuredPrizes.map((prize, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-2 bg-background rounded border"
                                                        >
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs">
                                                                #{prize.rank}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-medium">
                                                                    {formData.distributionType === "percentage"
                                                                        ? `${prize.prize}%`
                                                                        : `$${prize.prize}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center pt-4">
                                <RainbowButton
                                    type="submit"
                                    className="!bg-[#17181D]"
                                    disabled={isSaving}
                                >
                                    <HiBolt className="size-4" /> Deploy Leaderboard
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
                        <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t flex gap-3 justify-between bg-card">
                            <div className="flex items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Info className="w-4 h-4" />
                                            Variables Usage
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96 max-w-[calc(100vw-2rem)]" align="start">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Available Variables</h4>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Variables work in all text fields. Add <code className="bg-muted px-1 py-0.5 rounded text-xs">.uppercase</code> to any variable for uppercase formatting.
                                            </p>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[prizepool]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [prizepool]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The prize pool amount set in the Prize Distribution step. Defaults to &quot;$1,000&quot; if not set.
                                                    </p>
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[casino.name]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [casino.name]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The short name of the selected casino (e.g., &quot;Roobet&quot;).
                                                    </p>
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[casino.fullname]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [casino.fullname]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The full name of the selected casino with &quot;Casino&quot; suffix (e.g., &quot;Roobet Casino&quot;).
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">
                                                    <strong>Example:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">[prizepool] [casino.fullname]</code> → &quot;$1,000 Roobet Casino&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex gap-3">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="popout"
                                        onClick={handlePrevious}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                )}
                                {currentStep === 1 && canProceed() && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleConfirm}
                                        disabled={isConfirming}
                                    >
                                        {isConfirming ? "Creating..." : "Confirm"}
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
                        <div className="flex-shrink-0 pt-4 px-6 pb-6 border-t flex gap-3 justify-between bg-card">
                            <div className="flex items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Info className="w-4 h-4" />
                                            Variables Usage
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-96 max-w-[calc(100vw-2rem)]" align="start">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Available Variables</h4>
                                            <p className="text-xs text-muted-foreground mb-3">
                                                Variables work in all text fields. Add <code className="bg-muted px-1 py-0.5 rounded text-xs">.uppercase</code> to any variable for uppercase formatting.
                                            </p>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[prizepool]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [prizepool]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The prize pool amount set in the Prize Distribution step. Defaults to &quot;$1,000&quot; if not set.
                                                    </p>
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[casino.name]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [casino.name]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The short name of the selected casino (e.g., &quot;Roobet&quot;).
                                                    </p>
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyVariable("[casino.fullname]")}
                                                        className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-[#8BFF4D] hover:bg-muted/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        [casino.fullname]
                                                        <Copy className="w-3 h-3 opacity-70" />
                                                    </button>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        The full name of the selected casino with &quot;Casino&quot; suffix (e.g., &quot;Roobet Casino&quot;).
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">
                                                    <strong>Example:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">[prizepool] [casino.fullname]</code> → &quot;$1,000 Roobet Casino&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
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


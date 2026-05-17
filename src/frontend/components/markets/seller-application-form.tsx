"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Clock,
  Leaf,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SellerBrandPicker } from "@/components/markets/seller-brand-picker";
import { submitSellerMarketApplication } from "@/features/markets/actions";
import { compressSellerApplicationPhotos } from "@/lib/image/compression";
import { createBrand } from "@/lib/data/brands";
import {
  clampItemCountForRange,
  defaultItemCountForRange,
  SELLER_APPLICATION_MAX_PHOTOS,
  SELLER_APPLICATION_MIN_PHOTOS,
  SELLER_ITEM_COUNT_RANGES,
  type SellerApplicationInitialValues,
  type SellerItemCountRangeId,
} from "@/lib/markets/seller-application";
import { uploadSellerApplicationPhoto } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/client";
import type { Brand } from "@/types/items";
import { cn } from "@/lib/utils";

interface ImageFile {
  file: File;
  preview: string;
}

interface SellerApplicationFormProps {
  marketId: string;
  marketName: string;
  brands: Brand[];
  isEditing?: boolean;
  initialApplication?: SellerApplicationInitialValues;
}

const APPLY_CALLOUT_IMAGE = "/assets/images/apply-callout-card.png";
const SOCIAL_MEDIA_IMAGE = "/assets/images/social-media.png";
const PHOTO_THUMB_CLASS =
  "relative aspect-[3/4] w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-muted sm:w-20";
interface ReviewRowProps {
  icon: typeof Camera;
  iconClassName?: string;
  label: string;
  value: string;
}

function ReviewRow({ icon: Icon, iconClassName, label, value }: ReviewRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-border/60 py-3 text-sm last:border-b-0">
      <Icon className={cn("h-5 w-5 shrink-0", iconClassName ?? "text-primary")} aria-hidden />
      <span className="font-medium text-foreground">{label}</span>
      <span className="ml-auto max-w-[55%] text-right font-medium text-primary">{value}</span>
    </li>
  );
}

function RangeChip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
        selected
          ? "border-brand-accent bg-brand-accent text-white"
          : "border-border bg-card text-muted-foreground hover:border-primary/30"
      )}
    >
      <span>{label}</span>
      {selected ? (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white"
          aria-hidden
        >
          <Check className="h-3 w-3 text-brand-accent stroke-[3]" />
        </span>
      ) : null}
    </button>
  );
}

export function SellerApplicationForm({
  marketId,
  marketName,
  brands,
  isEditing = false,
  initialApplication,
}: SellerApplicationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(
    () => initialApplication?.stylePhotoUrls ?? []
  );
  const [images, setImages] = useState<ImageFile[]>([]);
  const [socialConsent, setSocialConsent] = useState(
    () => initialApplication?.socialMediaConsent ?? false
  );
  const [itemRange, setItemRange] = useState<SellerItemCountRangeId>(
    () => initialApplication?.itemCountRange ?? "11-25"
  );
  const [itemCount, setItemCount] = useState(
    () => initialApplication?.itemCount ?? defaultItemCountForRange("11-25")
  );
  const [allBrands, setAllBrands] = useState<Brand[]>(brands);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(
    () => initialApplication?.brandIds ?? []
  );
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [wantsVolunteer, setWantsVolunteer] = useState(
    () => initialApplication?.wantsToVolunteer ?? false
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  useEffect(() => {
    setAllBrands(brands);
  }, [brands]);

  const selectedBrands = useMemo(
    () => allBrands.filter((b) => selectedBrandIds.includes(b.id)),
    [allBrands, selectedBrandIds]
  );

  const availableBrands = useMemo(
    () => allBrands.filter((b) => !selectedBrandIds.includes(b.id)),
    [allBrands, selectedBrandIds]
  );

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const selectedBrandLabels = useMemo(
    () => selectedBrands.map((b) => b.name),
    [selectedBrands]
  );

  const totalPhotoCount = existingPhotoUrls.length + images.length;

  const canSubmit =
    totalPhotoCount >= SELLER_APPLICATION_MIN_PHOTOS &&
    socialConsent &&
    selectedBrandIds.length > 0 &&
    !isSubmitting;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = SELLER_APPLICATION_MAX_PHOTOS - totalPhotoCount;
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length === 0) return;

    const compressed = await compressSellerApplicationPhotos(picked);
    const nextImages = compressed.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) =>
      [...prev, ...nextImages].slice(0, SELLER_APPLICATION_MAX_PHOTOS - existingPhotoUrls.length)
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeBrand = (brandId: string) => {
    setSelectedBrandIds((prev) => prev.filter((id) => id !== brandId));
  };

  const addBrand = (brandId: string) => {
    if (!brandId || selectedBrandIds.includes(brandId)) return;
    setSelectedBrandIds((prev) => [...prev, brandId]);
  };

  const handleCreateBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;

    const result = await createBrand(name);
    if (result.success) {
      setAllBrands((prev) => [...prev, result.brand]);
      setSelectedBrandIds((prev) => [...prev, result.brand.id]);
      setNewBrandName("");
      setShowNewBrand(false);
      return;
    }

    setSubmitError("Failed to create brand: " + result.error);
  };

  const onRangeSelect = (rangeId: SellerItemCountRangeId) => {
    setItemRange(rangeId);
    setItemCount(defaultItemCountForRange(rangeId));
  };

  const adjustItemCount = (delta: number) => {
    setItemCount((prev) => clampItemCountForRange(itemRange, prev + delta));
  };

  const onSubmit = () => {
    setSubmitError(null);
    startSubmit(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSubmitError("You must be signed in to apply.");
          return;
        }

        const photoUrls = [...existingPhotoUrls];
        for (let index = 0; index < images.length; index++) {
          try {
            const url = await uploadSellerApplicationPhoto(user.id, marketId, images[index].file);
            photoUrls.push(url);
          } catch (uploadErr) {
            const detail =
              uploadErr instanceof Error ? uploadErr.message : "Photo upload failed";
            const photoNumber = existingPhotoUrls.length + index + 1;
            throw new Error(`Photo ${photoNumber} could not be uploaded. ${detail}`);
          }
        }

        const result = await submitSellerMarketApplication({
          marketId,
          stylePhotoUrls: photoUrls,
          socialMediaConsent: true,
          itemCount,
          itemCountRange: itemRange,
          brandIds: selectedBrandIds,
          wantsToVolunteer: wantsVolunteer,
        });

        if ("error" in result && result.error) {
          setSubmitError(result.error);
          return;
        }

        router.push(
          `/markets/${marketId}?${isEditing ? "applicationUpdated=1" : "applied=1"}`
        );
        router.refresh();
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : isEditing
              ? "Failed to update application"
              : "Failed to submit application"
        );
      }
    });
  };

  return (
    <div className="pb-36 md:pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="mt-0.5 h-9 w-9 shrink-0 rounded-full"
          >
            <Link href={`/markets/${marketId}`} aria-label="Back to market">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {isEditing ? "Review your application" : "Apply to Become a Seller"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{marketName}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-lavender/25 px-3 py-1.5 text-xs font-medium text-primary">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {isEditing ? "Under review" : "Takes 3 min"}
        </span>
      </header>

      <section
        className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-white bg-[length:100%_100%] bg-right bg-no-repeat min-h-[9.5rem] sm:min-h-[10.5rem]"
        style={{ backgroundImage: `url(${APPLY_CALLOUT_IMAGE})` }}
      >
        <div className="max-w-[52%] space-y-2 p-4 sm:max-w-[48%]">
          <p className="text-base font-bold leading-snug text-foreground">
            {isEditing
              ? "Update your photos and details."
              : "Show your style. Share what you'll sell."}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isEditing
              ? "Your application is under review. You can still change it until we respond."
              : "Help us build a community of conscious fashion sellers. Upload a few photos and tell us about your wardrobe."}
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">1. Upload Your Style</h2>
          <span className="rounded-full bg-brand-lavender/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {totalPhotoCount}/{SELLER_APPLICATION_MAX_PHOTOS} uploaded
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload 4–5 photos that show how you dress, your clothing style, or the clothes piles you
          want to sell.
        </p>

        <div className="flex flex-wrap gap-2.5">
          {existingPhotoUrls.map((url, index) => (
            <div key={url} className={PHOTO_THUMB_CLASS}>
              <Image
                src={url}
                alt={`Style photo ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeExistingPhoto(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-foreground shadow-sm"
                aria-label={`Remove saved photo ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.map((image, index) => (
            <div key={image.preview} className={PHOTO_THUMB_CLASS}>
              <Image
                src={image.preview}
                alt={`Style photo ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-foreground shadow-sm"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {totalPhotoCount < SELLER_APPLICATION_MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                PHOTO_THUMB_CLASS,
                "flex items-center justify-center border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              )}
              aria-label="Add photo"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />

        <p className="flex items-center gap-1.5 text-sm text-brand-accent">
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Minimum {SELLER_APPLICATION_MIN_PHOTOS} photos required
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-foreground">2. Social Media Consent (Required)</h2>
        <div
          className="overflow-hidden rounded-2xl border border-border/60 bg-white bg-[length:100%_100%] bg-right bg-no-repeat min-h-[7.5rem] sm:min-h-[8.5rem]"
          style={{ backgroundImage: `url(${SOCIAL_MEDIA_IMAGE})` }}
        >
          <div className="max-w-[72%] space-y-2 p-4 sm:max-w-[68%]">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={socialConsent}
                onCheckedChange={(v) => setSocialConsent(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-snug text-foreground">
                I consent to Bloem using these photos in social media or promotional posts.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              Required to submit. If unchecked, you cannot apply.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-foreground">3. How many items do you want to sell?</h2>
        <div className="flex flex-wrap gap-2">
          {SELLER_ITEM_COUNT_RANGES.map((range) => (
            <RangeChip
              key={range.id}
              label={range.label}
              selected={itemRange === range.id}
              onSelect={() => onRangeSelect(range.id)}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            type="button"
            onClick={() => adjustItemCount(-1)}
            aria-label="Decrease item count"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary transition-colors hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Minus className="h-3 w-3" aria-hidden />
          </button>
          <span className="min-w-[6rem] text-center text-base font-semibold text-foreground">
            {itemCount} items
          </span>
          <button
            type="button"
            onClick={() => adjustItemCount(1)}
            aria-label="Increase item count"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary transition-colors hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div>
          <h2 className="text-base font-bold text-foreground">4. Select Brands</h2>
          <p className="text-sm text-muted-foreground">Choose all that apply.</p>
        </div>
        {selectedBrands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => removeBrand(brand.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30"
              >
                {brand.name}
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
        <SellerBrandPicker brands={availableBrands} onSelect={addBrand} />
        {!showNewBrand ? (
          <button
            type="button"
            onClick={() => setShowNewBrand(true)}
            className="text-xs font-medium text-brand-purple"
          >
            + Add new brand
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand name"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateBrand();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleCreateBrand()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Save
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <div>
          <h2 className="text-base font-bold text-foreground">5. Would you like to volunteer at the market?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Volunteers help run the market and receive commission-free sales for this event.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setWantsVolunteer(false)}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
              !wantsVolunteer
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            No, not right now
          </button>
          <button
            type="button"
            onClick={() => setWantsVolunteer(true)}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
              wantsVolunteer
                ? "border-brand-accent bg-brand-accent/15 text-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            <span className="inline-flex items-center gap-2">
              {wantsVolunteer ? <Check className="h-4 w-4 text-brand-accent" /> : null}
              Yes, I&apos;d love to volunteer
            </span>
          </button>
        </div>
        {wantsVolunteer ? (
          <p className="flex items-center gap-2 rounded-xl bg-brand-accent/15 px-3 py-2.5 text-sm text-foreground">
            <Leaf className="h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
            Volunteer sellers get commission-free sales at this market.
          </p>
        ) : null}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-bold text-foreground">6. Review Your Application</h2>
        <ul className="rounded-2xl border border-border/60 bg-card px-4 py-1">
          <ReviewRow
            icon={Camera}
            label="Photos"
            value={`${totalPhotoCount} of ${SELLER_APPLICATION_MAX_PHOTOS} uploaded`}
          />
          <ReviewRow
            icon={ShoppingBag}
            label="Items to Sell"
            value={`${itemCount} items (${SELLER_ITEM_COUNT_RANGES.find((r) => r.id === itemRange)?.label ?? ""})`}
          />
          <ReviewRow
            icon={Tag}
            label="Brands"
            value={
              selectedBrandLabels.length > 0 ? selectedBrandLabels.join(", ") : "None selected"
            }
          />
          <ReviewRow
            icon={Leaf}
            iconClassName="text-brand-accent"
            label="Volunteer"
            value={wantsVolunteer ? "Yes, I'd love to volunteer" : "No, not right now"}
          />
        </ul>
        <p className="flex items-center gap-2 rounded-xl bg-brand-lavender/20 px-3 py-2.5 text-sm text-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          Applications are reviewed within 2–3 business days.
        </p>
      </section>

      {submitError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <div
        className="fixed inset-x-0 bottom-16 z-30 border-t border-border/70 bg-background/95 px-4 pb-4 pt-3 backdrop-blur-md md:static md:bottom-auto md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {isSubmitting
            ? isEditing
              ? "Saving…"
              : "Submitting…"
            : isEditing
              ? "Save application"
              : "Submit Seller Application"}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          By submitting, you agree to the seller review process.
        </p>
      </div>
    </div>
  );
}


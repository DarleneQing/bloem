import { z } from "zod";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be less than ${max} characters`)
    .optional()
    .or(z.literal(""));

export const addressFormFieldsSchema = z
  .object({
    addressStreet: optionalText(120, "Street name"),
    addressHouseNumber: optionalText(20, "House number"),
    addressPostalCode: optionalText(20, "Postal code"),
    addressCity: optionalText(100, "City"),
    addressCountry: optionalText(100, "Country"),
  })
  .superRefine((data, ctx) => {
    const hasAddressField = [
      data.addressStreet,
      data.addressHouseNumber,
      data.addressPostalCode,
      data.addressCity,
      data.addressCountry,
    ].some((part) => part?.trim());

    if (!hasAddressField) {
      return;
    }

    if (!data.addressStreet?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Street name is required when providing an address",
        path: ["addressStreet"],
      });
    }
    if (!data.addressPostalCode?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Postal code is required when providing an address",
        path: ["addressPostalCode"],
      });
    }
    if (!data.addressCity?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "City is required when providing an address",
        path: ["addressCity"],
      });
    }
    if (!data.addressCountry?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Country is required when providing an address",
        path: ["addressCountry"],
      });
    }
  });

export type AddressFormFields = z.infer<typeof addressFormFieldsSchema>;

export const emptyAddressFormFields: AddressFormFields = {
  addressStreet: "",
  addressHouseNumber: "",
  addressPostalCode: "",
  addressCity: "",
  addressCountry: "Switzerland",
};

export function formatEuropeanAddress(parts: AddressFormFields): string | undefined {
  const streetName = parts.addressStreet?.trim() ?? "";
  const houseNumber = parts.addressHouseNumber?.trim() ?? "";
  const postalCode = parts.addressPostalCode?.trim() ?? "";
  const city = parts.addressCity?.trim() ?? "";
  const country = parts.addressCountry?.trim() ?? "";

  if (!streetName && !houseNumber && !postalCode && !city && !country) {
    return undefined;
  }

  const streetPart = `${houseNumber ? `${houseNumber} ` : ""}${streetName}`.trim();
  const cityPart = `${postalCode ? `${postalCode} ` : ""}${city}`.trim();
  const segments = [streetPart, cityPart, country].filter(Boolean);

  return segments.length > 0 ? segments.join(", ") : undefined;
}

function parseStreetSegment(segment: string): Pick<AddressFormFields, "addressStreet" | "addressHouseNumber"> {
  const leadingNumber = segment.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
  if (leadingNumber) {
    return {
      addressHouseNumber: leadingNumber[1],
      addressStreet: leadingNumber[2],
    };
  }
  return { addressStreet: segment, addressHouseNumber: "" };
}

function parseCitySegment(segment: string): Pick<AddressFormFields, "addressPostalCode" | "addressCity"> {
  const leadingPostal = segment.match(/^(\d{4,6})\s+(.+)$/);
  if (leadingPostal) {
    return {
      addressPostalCode: leadingPostal[1],
      addressCity: leadingPostal[2],
    };
  }
  return { addressPostalCode: "", addressCity: segment };
}

/** Best-effort split of a stored `profiles.address` string into form fields. */
export function parseEuropeanAddress(address: string | null | undefined): AddressFormFields {
  if (!address?.trim()) {
    return { ...emptyAddressFormFields };
  }

  const segments = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { ...emptyAddressFormFields };
  }

  if (segments.length === 1) {
    return { ...emptyAddressFormFields, ...parseStreetSegment(segments[0]) };
  }

  const country = segments.length >= 3 ? segments[segments.length - 1] : "";
  const citySegmentIndex = segments.length >= 3 ? segments.length - 2 : segments.length - 1;
  const citySegment = segments[citySegmentIndex] ?? "";
  const street = parseStreetSegment(segments[0]);
  const city = parseCitySegment(citySegment);

  return {
    ...street,
    ...city,
    addressCountry: country || emptyAddressFormFields.addressCountry,
  };
}

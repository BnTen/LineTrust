/** SEO / indexation gate — DATA_PUBLIC must stay false until human data validation. */

export function isDataPublic(): boolean {
  return process.env.DATA_PUBLIC === "true";
}

export function robotsPolicy(): {
  index: boolean;
  follow: boolean;
} {
  if (isDataPublic()) {
    return { index: true, follow: true };
  }
  return { index: false, follow: false };
}

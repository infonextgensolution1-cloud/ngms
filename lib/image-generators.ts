// Free AI image generators linked from the admin Prompt Dashboard.
// Free plans change often, so the wording here stays general (no exact limits) and
// GENERATORS_CHECKED says when it was last looked at. Re-check before relying on a limit.

export interface ImageGenerator {
  id: string
  name: string
  /** Short label for the compact "copy and open" buttons inside a prompt. */
  short: string
  url: string
  bestFor: string
  free: string
  watch: string
  noSignIn?: boolean
}

export const GENERATORS_CHECKED = 'September 2026'

export const GENERATORS: readonly ImageGenerator[] = [
  {
    id: 'ideogram',
    name: 'Ideogram',
    short: 'Ideogram',
    url: 'https://ideogram.ai',
    bestFor: 'Images with readable words on them: signs, flyers, van wraps, "Call NGMS" banners.',
    free: 'Free credits with a Google, Apple or Microsoft sign-in. The amount changes, so check inside the app.',
    watch: 'Free images are public by default. Ideogram says you can use them commercially.',
  },
  {
    id: 'leonardo',
    name: 'Leonardo.Ai',
    short: 'Leonardo',
    url: 'https://leonardo.ai',
    bestFor: 'Realistic house, roof, pool and solar shots, with plenty of style controls.',
    free: 'About 150 free tokens a day (per its pricing page). Email or Google sign-in.',
    watch: 'Free-plan images are public and Leonardo keeps broad rights to them. You do get a commercial-use licence.',
  },
  {
    id: 'bing',
    name: 'Bing Image Creator',
    short: 'Bing',
    url: 'https://www.bing.com/images/create',
    bestFor: 'Quick, clean social images and quote or proposal cover visuals.',
    free: 'Free with a Microsoft account: a few fast credits, then slower generation.',
    watch: 'Microsoft’s free terms lean towards personal use. Check them before using an image in paid ads.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    short: 'Gemini',
    url: 'https://gemini.google.com',
    bestFor: 'Describing the picture in plain English and trying ideas fast.',
    free: 'Free with a Google account. Google does not publish the daily limit.',
    watch: 'Images carry a visible watermark and an invisible SynthID mark.',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    short: 'ChatGPT',
    url: 'https://chatgpt.com',
    bestFor: 'Refining an image by chatting: change the sky, the colours, the wording.',
    free: 'Free with an account, up to a daily cap that can slow down when it is busy.',
    watch: 'The cap changes from day to day.',
  },
  {
    id: 'canva',
    name: 'Canva',
    short: 'Canva',
    url: 'https://www.canva.com/ai-image-generator/',
    bestFor: 'Making the image and the finished post, flyer or quote cover in one place.',
    free: 'Sign-in needed. AI use on the free plan is capped, and the cap changes.',
    watch: 'Check your remaining free uses inside Canva before you plan a batch of posts.',
  },
  {
    id: 'firefly',
    name: 'Adobe Firefly',
    short: 'Firefly',
    url: 'https://firefly.adobe.com',
    bestFor: 'Polished marketing images and text effects.',
    free: 'Free daily generations with an Adobe account, according to Adobe’s plans page.',
    watch: 'Adobe does not spell out the free-plan commercial terms there. Check them first.',
  },
  {
    id: 'craiyon',
    name: 'Craiyon',
    short: 'Craiyon',
    url: 'https://www.craiyon.com',
    bestFor: 'Rough concept ideas when you do not want to sign in.',
    free: 'Free, no sign-in. Lower quality, and you may wait at busy times.',
    watch: 'Free images carry a watermark and need a credit to craiyon.com when you use them.',
    noSignIn: true,
  },
]

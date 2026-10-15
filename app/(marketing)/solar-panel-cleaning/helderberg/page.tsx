import { redirect } from 'next/navigation'

// Retire the legacy location-specific landing page and send visitors to the
// current solar panel cleaning service page instead of leaving a dead URL.
export default function Page() {
  redirect('/services/solar-panel-cleaning')
}

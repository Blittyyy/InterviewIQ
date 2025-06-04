import SignupForm from "@/components/signup-form"
import { WavyBackground } from "@/components/ui/wavy-background"

export default function SignupPage() {
  return (
    <WavyBackground backgroundFill="#fff" blur={20} waveOpacity={0.15}>
      <SignupForm />
    </WavyBackground>
  )
} 
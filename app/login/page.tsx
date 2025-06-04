import LoginForm from "@/components/login-form"
import { WavyBackground } from "@/components/ui/wavy-background"

export default function LoginPage() {
  return (
    <WavyBackground backgroundFill="#fff" blur={20} waveOpacity={0.15}>
      <LoginForm />
    </WavyBackground>
  )
} 
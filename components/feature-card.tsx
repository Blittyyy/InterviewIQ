import React from "react"
import {
  Building2Icon,
  PackageIcon,
  NewspaperIcon,
  UsersIcon,
  MessageSquareIcon,
  FileTextIcon,
  GlobeIcon,
  BookmarkIcon,
  ZapIcon,
  BarChartIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type FeatureIconType =
  | "building"
  | "package"
  | "newspaper"
  | "users"
  | "message-square"
  | "file-text"
  | "globe"
  | "bookmark"
  | "zap"
  | "chart"

interface FeatureCardProps {
  icon: FeatureIconType
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "building":
        return <Building2Icon className="h-5 w-5" />
      case "package":
        return <PackageIcon className="h-5 w-5" />
      case "newspaper":
        return <NewspaperIcon className="h-5 w-5" />
      case "users":
        return <UsersIcon className="h-5 w-5" />
      case "message-square":
        return <MessageSquareIcon className="h-5 w-5" />
      case "file-text":
        return <FileTextIcon className="h-5 w-5" />
      case "globe":
        return <GlobeIcon className="h-5 w-5" />
      case "bookmark":
        return <BookmarkIcon className="h-5 w-5" />
      case "zap":
        return <ZapIcon className="h-5 w-5" />
      case "chart":
        return <BarChartIcon className="h-5 w-5" />
      default:
        return <ZapIcon className="h-5 w-5" />
    }
  }

  return (
    <div className="group will-change-transform transform-gpu transition-transform duration-300 hover:-translate-y-1 [backface-visibility:hidden] translate-z-0">
      <Card className="overflow-hidden border-0 shadow-md group-hover:shadow-xl bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-gray-50 transition-colors duration-300">
        <CardContent className="p-6">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#4B6EF5]/10 to-[#8C52FF]/10 flex items-center justify-center mb-4">
            <div className="text-[#4B6EF5] transition-colors duration-300">{getIcon()}</div>
          </div>
          <h3 className="text-lg font-semibold mb-2 transition-colors duration-300">{title}</h3>
          <p className="text-gray-600 text-sm transition-colors duration-300">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}

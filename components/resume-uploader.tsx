"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadIcon, FileIcon, XIcon } from "lucide-react"

export default function ResumeUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    return validTypes.includes(file.type)
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Resume (optional)</label>
        <span className="text-xs text-gray-500">PDF or DOCX</span>
      </div>

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-[#4B6EF5] bg-[#4B6EF5]/5"
              : "border-gray-300 hover:border-[#4B6EF5] hover:bg-[#4B6EF5]/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("resume-upload")?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadIcon className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-[#4B6EF5]">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">Upload your resume to get personalized talking points</p>
          </div>
          <input id="resume-upload" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-[#4B6EF5]/10 flex items-center justify-center">
              <FileIcon className="h-5 w-5 text-[#4B6EF5]" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={removeFile} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import {
  FileText,
  Upload,
  Loader2,
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  FileStack,
  ChevronDown,
  Phone,
  Mail,
  BookOpen,
  HelpCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileUploadZone } from "@/components/file-upload-zone"
import type { AcordExtractedData } from "@/lib/types"
import { PolicyChat } from "@/components/policy-chat"

interface QuoteRecord {
  quoteNo: string
  customer: string
  effectiveDate: string
  firstCalculation: string
  broker: string
  issuer: string
  premium: number
  status: "Quoted" | "Refer to underwriters" | "Issued" | "Processing"
}

export function IntakePortal() {
  const [acordFile, setAcordFile] = useState<File | null>(null)
  const [acordLoading, setAcordLoading] = useState(false)
  const [acordError, setAcordError] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [activeNav, setActiveNav] = useState("dashboard")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const generateQuoteNo = () => {
    const num = Math.floor(Math.random() * 90000000) + 10000000
    return `DC-${num}`
  }

  const handleAcordUpload = async () => {
    if (!acordFile) return

    setAcordLoading(true)
    setAcordError(null)

    try {
      const formData = new FormData()
      formData.append("file", acordFile)

      const response = await fetch("/api/acord125/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to process application")
      }

      const data: AcordExtractedData = await response.json()

      // Transform ACORD data into a quote record
      const today = new Date()
      const effectiveDate = new Date(data.effective_date)
      
      const newQuote: QuoteRecord = {
        quoteNo: generateQuoteNo(),
        customer: data.insured_name,
        effectiveDate: effectiveDate.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        firstCalculation: today.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        broker: "Test Broker",
        issuer: "Ram &amp; Shri",
        premium: Math.floor(Math.random() * 9000) + 500,
        status: data.risk_score === "High" 
          ? "Refer to underwriters" 
          : data.risk_score === "Medium" 
            ? "Quoted" 
            : "Issued",
      }

      setQuotes((prev) => [newQuote, ...prev])
      setAcordFile(null)
    } catch (error) {
      setAcordError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      )
    } finally {
      setAcordLoading(false)
    }
  }

  const getStatusBadge = (status: QuoteRecord["status"]) => {
    switch (status) {
      case "Quoted":
        return (
          <Badge variant="outline" className="border-foreground/30 text-foreground bg-transparent font-normal">
            Quoted
          </Badge>
        )
      case "Refer to underwriters":
        return (
          <Badge className="bg-warning text-warning-foreground font-normal border-0">
            Refer to underwriters
          </Badge>
        )
      case "Issued":
        return (
          <Badge className="bg-success text-success-foreground font-normal border-0">
            Issued
          </Badge>
        )
      case "Processing":
        return (
          <Badge variant="secondary" className="font-normal">
            Processing
          </Badge>
        )
    }
  }

  const navItems = [
    { id: "new-quote", label: "New quote", icon: PlusCircle },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "quotes", label: "Quotes", icon: ClipboardList },
    { id: "policies", label: "Policies", icon: FileStack, hasSubmenu: true },
  ]

  const now = new Date()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[200px] bg-sidebar-bg flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 pb-6">
          <div className="flex flex-col items-center gap-1 text-sidebar-foreground">
            <svg
              viewBox="0 0 40 50"
              fill="none"
              className="w-10 h-12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 48V10L20 2L38 10V48H30V20L20 15L10 20V48H2Z"
                stroke="currentColor"
                strokeWidth="2"
                className="text-accent"
              />
            </svg>
            <span className="text-xs tracking-[0.2em] font-light">DISTRICT</span>
            <span className="text-xs tracking-[0.2em] font-light">COVER</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                activeNav === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.hasSubmenu && (
                <ChevronDown className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm">
              RS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">Ram &amp; Shri</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">ram.shri@email.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-12 bg-primary flex items-center justify-end px-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <span className="text-sm">Ram &amp; Shri</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-3xl font-light text-foreground">
              Hello, Ram &amp; Shri!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(now)} {formatTime(now)}
            </p>
          </div>

          {/* Upload and Contact Cards */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Upload Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        Commercial Package
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Commercial Package</DropdownMenuItem>
                      <DropdownMenuItem>General Liability</DropdownMenuItem>
                      <DropdownMenuItem>Property Insurance</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  onFileSelect={setAcordFile}
                  disabled={acordLoading}
                />

                {acordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{acordError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAcordUpload}
                  disabled={!acordFile || acordLoading}
                  className="w-full"
                  size="lg"
                >
                  {acordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Application
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

           {/* Policy Chat (replaces Contact card) */}
            <PolicyChat /> 
          </div>

          {/* Latest Quotes Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <FileText className="w-5 h-5" />
                Latest quotes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {quotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Quote No
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Customer
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Effective Date
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        First Calculation
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Broker
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Issuer
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                        Premium
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.quoteNo} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-primary">
                          {quote.quoteNo}
                        </TableCell>
                        <TableCell>{quote.customer}</TableCell>
                        <TableCell>{quote.effectiveDate}</TableCell>
                        <TableCell>{quote.firstCalculation}</TableCell>
                        <TableCell>{quote.broker}</TableCell>
                        <TableCell>{quote.issuer}</TableCell>
                        <TableCell className="text-right">
                          {quote.premium.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(quote.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No quotes yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    Upload an application above to generate your first quote.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

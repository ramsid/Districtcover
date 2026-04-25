"use client"

import {
  Building2,
  Calendar,
  MapPin,
  Car,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  ClipboardList,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AcordExtractedData } from "@/lib/types"

interface AcordResultsProps {
  data: AcordExtractedData
}

export function AcordResults({ data }: AcordResultsProps) {
  const getRiskScoreColor = (score: string) => {
    switch (score) {
      case "Low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const detailItems = [
    {
      icon: Building2,
      label: "Business Type",
      value: data.business_type,
    },
    {
      icon: ClipboardList,
      label: "Policy Type",
      value: data.policy_type,
    },
    {
      icon: Calendar,
      label: "Effective Date",
      value: new Date(data.effective_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    {
      icon: MapPin,
      label: "Locations",
      value: data.locations.toString(),
    },
    {
      icon: Car,
      label: "Vehicles",
      value: data.vehicles.toString(),
    },
    {
      icon: Users,
      label: "Employees",
      value: data.employees.toString(),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Extraction Complete
            </CardTitle>
            <Badge
              variant="outline"
              className={getRiskScoreColor(data.risk_score)}
            >
              Risk: {data.risk_score}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {data.insured_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.business_type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missing Fields Warning */}
      {data.missing_fields.length > 0 && (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
          <FileWarning className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Missing Information</AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-2">
              The following required fields were not found in the document:
            </p>
            <div className="flex flex-wrap gap-2">
              {data.missing_fields.map((field) => (
                <Badge
                  key={field}
                  variant="outline"
                  className="border-amber-300 bg-amber-100 text-amber-800"
                >
                  {field}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Underwriting Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Underwriting Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
          <Separator className="my-4" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Requires manual review before binding</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

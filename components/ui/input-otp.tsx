"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => {
  // Add safety check for the context
  const inputOTPContext = React.useContext(OTPInputContext)
  
  // Don't render until context is ready
  if (!inputOTPContext || !inputOTPContext.slots) {
    return (
      <div className={cn("flex items-center gap-2", containerClassName)}>
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-10 border border-slate-200 rounded-md bg-slate-100 animate-pulse" />
      </div>
    )
  }

  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
})
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  
  // Comprehensive null check for context and slots
  if (!inputOTPContext || !inputOTPContext.slots || !inputOTPContext.slots[index]) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-10 w-10 text-center text-base font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }

  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-10 w-10 text-center text-base font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        isActive && "border-slate-400 ring-1 ring-slate-400",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-caret-blink">
          <div className="h-4 w-px bg-slate-900" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

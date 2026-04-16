import React from "react";
import { Link } from "react-router-dom";

function PageState({ icon, title, message, primary, secondary }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-[28px] bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 md:p-10 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0b5d3b] bg-[#edf7f1] text-5xl shadow-sm">
          {icon}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-[#103b2d] tracking-tight">
          {title}
        </h1>

        <p className="mt-4 text-[16px] md:text-[17px] leading-7 text-gray-600 max-w-md mx-auto">
          {message}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {primary}
          {secondary}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, to, onClick }) {
  const className =
    "inline-flex items-center justify-center rounded-xl bg-[#0b5d3b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08482d] focus:outline-none focus:ring-2 focus:ring-[#0b5d3b]/30";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, to, onClick }) {
  const className =
    "inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-[#103b2d] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200";

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function OfflinePage() {
  return (
    <PageState
      icon="📡"
      title="No Internet Connection"
      message="We can’t connect right now. Please check your Wi-Fi or mobile data, then try again."
      primary={
        <PrimaryButton onClick={() => window.location.reload()}>
          Retry Connection
        </PrimaryButton>
      }
      secondary={<SecondaryButton to="/">Go Home</SecondaryButton>}
    />
  );
}

export function NotFoundPage() {
  return (
    <PageState
      icon="🔍"
      title="Page Not Found"
      message="The page you’re looking for may have been moved, deleted, or the link may be incorrect."
      primary={<PrimaryButton to="/">Back to Dashboard</PrimaryButton>}
      secondary={
        <SecondaryButton onClick={() => window.history.back()}>
          Go Back
        </SecondaryButton>
      }
    />
  );
}

export function UnauthorizedPage() {
  return (
    <PageState
      icon="⛔"
      title="Access Denied"
      message="You do not have permission to access this page. Please return to a page you’re allowed to view."
      primary={<PrimaryButton to="/">Back to Dashboard</PrimaryButton>}
    />
  );
}

export function SessionExpiredPage() {
  return (
    <PageState
      icon="🔐"
      title="Session Expired"
      message="Your session has ended for security reasons. Please log in again to continue."
      primary={<PrimaryButton to="/client-login">Log In Again</PrimaryButton>}
      secondary={<SecondaryButton to="/">Go Home</SecondaryButton>}
    />
  );
}

export function ServerErrorPage() {
  return (
    <PageState
      icon="⚠️"
      title="Something Went Wrong"
      message="An unexpected error occurred while loading this page. Please try again."
      primary={
        <PrimaryButton onClick={() => window.location.reload()}>
          Refresh Page
        </PrimaryButton>
      }
      secondary={<SecondaryButton to="/">Go Home</SecondaryButton>}
    />
  );
}

export function WidgetErrorCard({
  title = "Unable to load section",
  message = "This data could not be loaded right now.",
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-100 text-xl">
          ⚠️
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-red-700">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#0b5d3b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#08482d]"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
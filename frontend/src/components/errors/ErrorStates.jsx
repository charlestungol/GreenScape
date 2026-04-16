import React from "react";
import { Link } from "react-router-dom";

function PageState({ icon, title, message, primary, secondary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7f7] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-md border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-3">{message}</p>

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          {primary}
          {secondary}
        </div>
      </div>
    </div>
  );
}

export function OfflinePage() {
  return (
    <PageState
      icon="📡"
      title="No Internet Connection"
      message="Please check your Wi-Fi or mobile data and try again."
      primary={
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Retry
        </button>
      }
      secondary={
        <Link
          to="/"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Go Home
        </Link>
      }
    />
  );
}

export function NotFoundPage() {
  return (
    <PageState
      icon="🔍"
      title="404 - Page Not Found"
      message="The page you are looking for does not exist."
      primary={
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Go Home
        </Link>
      }
      secondary={
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Go Back
        </button>
      }
    />
  );
}

export function UnauthorizedPage() {
  return (
    <PageState
      icon="⛔"
      title="403 - Access Denied"
      message="You do not have permission to view this page."
      primary={
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Go Home
        </Link>
      }
    />
  );
}

export function SessionExpiredPage() {
  return (
    <PageState
      icon="🔐"
      title="Session Expired"
      message="Your session has ended. Please log in again."
      primary={
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Login Again
        </Link>
      }
    />
  );
}

export function ServerErrorPage() {
  return (
    <PageState
      icon="⚠️"
      title="500 - Server Error"
      message="Something went wrong on our side. Please try again."
      primary={
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800"
        >
          Retry
        </button>
      }
      secondary={
        <Link
          to="/"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Go Home
        </Link>
      }
    />
  );
}

export function WidgetErrorCard({ title, message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="font-semibold text-red-800">{title}</h3>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}
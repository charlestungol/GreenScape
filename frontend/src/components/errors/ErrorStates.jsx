import React from "react";
import { Link } from "react-router-dom";
import "./ErrorStates.css";

function PageState({ icon, title, message, primary, secondary }) {
  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon-wrap">
          <div className="error-icon">{icon}</div>
        </div>

        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>

        <div className="error-actions">
          {primary}
          {secondary}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, to, onClick }) {
  if (to) {
    return (
      <Link to={to} className="error-btn error-btn-primary">
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="error-btn error-btn-primary">
      {children}
    </button>
  );
}

function SecondaryButton({ children, to, onClick }) {
  if (to) {
    return (
      <Link to={to} className="error-btn error-btn-secondary">
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="error-btn error-btn-secondary">
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
      message="You do not have permission to access this page."
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
    <div className="widget-error-card">
      <div className="widget-error-icon">⚠️</div>

      <div className="widget-error-content">
        <h3>{title}</h3>
        <p>{message}</p>

        {onRetry && (
          <button onClick={onRetry} className="error-btn error-btn-primary">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
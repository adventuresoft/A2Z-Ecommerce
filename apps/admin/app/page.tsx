import Link from "next/link";

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-light p-4">
      <div className="card shadow-sm" style={{ maxWidth: "480px", width: "100%" }}>
        <div className="card-header bg-primary text-white text-center py-3">
          <h4 className="mb-0 fw-semibold">
            <i className="bi bi-speedometer2 me-2"></i>
            AZ E-Commerce Admin
          </h4>
        </div>
        <div className="card-body p-4 text-center">
          <p className="text-secondary mb-4">
            Operations and Back-Office Management Portal.
          </p>
          <div className="alert alert-info text-start d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-info-circle-fill me-2 fs-5"></i>
            <div>
              <strong>Phase 0 Complete:</strong> Admin workspace unified with AdminLTE 4 and Bootstrap 5.
            </div>
          </div>
          <div className="d-grid gap-2">
            <Link href="/" className="btn btn-outline-primary">
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </Link>
          </div>
        </div>
        <div className="card-footer text-muted text-center py-2 small">
          Single-Vendor E-commerce AdminLTE 4 Shell
        </div>
      </div>
    </div>
  );
}

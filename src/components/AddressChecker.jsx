import React, { useState } from "react";
import axios from "axios";

const AddressChecker = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [coverageResult, setCoverageResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const openModal = () => {
    setModalOpen(true);
    setCoverageResult(null);
    setAddress("");
    setUserInfo({ fullName: "", email: "", phone: "" });
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setCoverageResult(null);

    try {
      const response = await axios.post("http://localhost:5000/api/check-coverage", {
        address,
      });
      setCoverageResult(response.data);
    } catch (error) {
      console.error("Error checking coverage:", error);
      setCoverageResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleInfoChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    console.log("Collected User Info (no coverage):", {
      ...userInfo,
      address,
    });
    alert("Thanks! We’ve saved your info and will contact you when coverage is available.");
    closeModal();
  };

  return (
    <div className="app-container">
      <div className="cta-card" onClick={openModal}>
        <h2 className="cta-title">KKON Coverage Checker</h2>
        <p className="cta-subtitle">Tap to check if KKON is available in your area</p>
        <div className="pulse-ring"></div>
        <div className="arrow-bounce">⬇</div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()} // Prevent modal close on click inside
          >
            {!coverageResult && (
              <form onSubmit={handleSubmit} className="modal-form">
                <h2>Enter Your Address</h2>
                <input
                  type="text"
                  placeholder="Your Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Checking..." : "Check Coverage"}
                </button>
                <button
                  type="button"
                  className="close-btn"
                  onClick={closeModal}
                  style={{ marginTop: "10px" }}
                >
                  Cancel
                </button>
              </form>
            )}

            {coverageResult?.coverage === true && (
              <div>
                <h2>✅ Good News!</h2>
                <p>Your address <strong>{address}</strong> is covered by KKON.</p>
                <button onClick={closeModal} className="close-btn">Close</button>
              </div>
            )}

            {coverageResult?.coverage === false && (
              <form onSubmit={handleInfoSubmit} className="modal-form">
                <h2>❌ Sorry, No Coverage Yet</h2>
                <p>
                  Your address <strong>{address}</strong> is not covered yet.
                  Please leave your contact info and we will notify you when coverage is available.
                </p>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={userInfo.fullName}
                  onChange={handleInfoChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={userInfo.email}
                  onChange={handleInfoChange}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={userInfo.phone}
                  onChange={handleInfoChange}
                  required
                />
                <button type="submit">Submit Info</button>
                <button
                  type="button"
                  className="close-btn"
                  onClick={closeModal}
                  style={{ marginTop: "10px" }}
                >
                  Cancel
                </button>
              </form>
            )}

            {coverageResult?.error && (
              <div>
                <h2>Error</h2>
                <p>Something went wrong while checking coverage. Please try again.</p>
                <button onClick={closeModal} className="close-btn">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressChecker;

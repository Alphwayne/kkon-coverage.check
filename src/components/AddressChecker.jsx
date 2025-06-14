import React, { useState } from "react";
import axios from "axios";

const normalizeInput = (input) => {
  const lower = input.toLowerCase();
  return lower
    .replace(/\bst\b/g, "street")
    .replace(/\brd\b/g, "road")
    .replace(/\bave\b/g, "avenue")
    .replace(/\bdr\b/g, "drive")
    .replace(/\bct\b/g, "court")
    .replace(/\bln\b/g, "lane")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
};

const AddressChecker = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [coverageResult, setCoverageResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchedLocations, setMatchedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

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
    setMatchedLocations([]);
    setSelectedLocation(null);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setCoverageResult(null);
    setMatchedLocations([]);

    try {
      const normalizedAddress = normalizeInput(address);
      const response = await axios.post("https://kkon-cc-backend.onrender.com/api/match-streets", { address: normalizedAddress });
      if (response.data.results.length > 0) {
        setMatchedLocations(response.data.results);
      } else {
        setCoverageResult({ coverage: false, address });
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      setCoverageResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  const checkCoverageByCoordinates = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    try {
      const [lng, lat] = selectedLocation.coordinates;
      const response = await axios.post("https://kkon-cc-backend.onrender.com/api/check-coordinates", {
        lat,
        lng,
      });
      setCoverageResult({ ...response.data, address: selectedLocation.name });
    } catch (error) {
      console.error("Coverage check failed:", error);
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {!coverageResult && matchedLocations.length === 0 && (
              <form onSubmit={handleSearch} className="modal-form">
                <h2>Enter Your Street Name</h2>
                <input
                  type="text"
                  placeholder="e.g. Allen / Toyin"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </button>
                <button type="button" className="close-btn" onClick={closeModal} style={{ marginTop: "10px" }}>
                  Cancel
                </button>
              </form>
            )}

            {matchedLocations.length > 0 && !selectedLocation && (
              <div className="modal-form">
                <h2>Select Your Exact Location</h2>
                <ul style={{ padding: 0, listStyle: "none" }}>
                  {matchedLocations.map((loc, idx) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      <button
                        onClick={() => setSelectedLocation(loc)}
                        className="location-option"
                        style={{ width: "100%", padding: "10px", textAlign: "left" }}
                      >
                        {loc.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="close-btn" onClick={closeModal} style={{ marginTop: "10px" }}>
                  Cancel
                </button>
              </div>
            )}

            {selectedLocation && !coverageResult && (
              <div className="modal-form">
                <h2>Confirm Your Location</h2>
                <p>{selectedLocation.name}</p>
                <button onClick={checkCoverageByCoordinates} disabled={loading}>
                  {loading ? "Checking..." : "Check Coverage"}
                </button>
              </div>
            )}

            {coverageResult?.coverage === true && (
              <div>
                <h2>✅ Good News!</h2>
                <p>Your location <strong>{coverageResult.address}</strong> is covered by KKON.</p>
                <button onClick={closeModal} className="close-btn">Close</button>
              </div>
            )}

            {coverageResult?.coverage === false && (
              <form onSubmit={handleInfoSubmit} className="modal-form">
                <h2>❌ Sorry, No Coverage Yet</h2>
                <p>
                  Your location <strong>{coverageResult.address}</strong> is not covered yet.
                  Please leave your contact information and we will notify you when coverage is available.
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

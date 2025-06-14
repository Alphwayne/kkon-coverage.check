import React, { useState } from "react";
import axios from "axios";

const normalizeInput = (input) => {
  const abbreviations = {
    st: "street",
    rd: "road",
    ave: "avenue",
    blvd: "boulevard",
    cres: "crescent",
    hwy: "highway",
  };

  return input
    .toLowerCase()
    .split(" ")
    .map((word) => abbreviations[word] || word)
    .join(" ");
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

      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: normalizedAddress,
          format: "json",
          addressdetails: 1,
          countrycodes: "ng",
          limit: 5,
        },
        headers: {
          'Accept-Language': 'en'
        }
      });

      if (response.data.length === 0) {
        setCoverageResult({ coverage: false, address });
        return;
      }

      const results = response.data.map((loc) => ({
        name: loc.display_name,
        coordinates: [parseFloat(loc.lon), parseFloat(loc.lat)],
      }));
      setMatchedLocations(results);
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
      const response = await axios.post("http://localhost:5000/api/check-coverage", {
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
                  placeholder="e.g. Allen Avenue"
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
                <ul style={{ paddingLeft: 0 }}>
                  {matchedLocations.map((loc, idx) => (
                    <li key={idx} style={{ listStyle: "none", marginBottom: "10px" }}>
                      <button
                        onClick={() => setSelectedLocation(loc)}
                        className="location-option"
                        style={{
                          background: "#ffffff",
                          border: "1px solid #d32f2f",
                          color: "#333333",
                          padding: "12px 16px",
                          borderRadius: "6px",
                          width: "100%",
                          textAlign: "left",
                          fontSize: "15px",
                          fontWeight: "500",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        }}
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

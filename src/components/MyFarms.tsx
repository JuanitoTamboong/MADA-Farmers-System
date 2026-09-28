import { useState } from "react";
import "../css/MyFarms.css";
import AddFarmModal from "./AddFarmModal";
import farmThumbnail from "../assets/images/farm.jfif"; // Replace with your image asset path

interface FarmItem {
  id: string;
  name: string;
  location: string;
  area: string;
  crop: string;
  status: string;
  plantedDate: string;
  expectedHarvest: string;
  image?: string;
}

const initialFarmsData: FarmItem[] = [
  {
    id: "1",
    name: "San Jose Farm",
    location: "Odiongan, Romblon",
    area: "2.5 hectares",
    crop: "Rice",
    status: "Growing",
    plantedDate: "Aug 15, 2025",
    expectedHarvest: "Nov 25, 2025",
    image: farmThumbnail,
  },
  {
    id: "2",
    name: "Agbaluto Farm",
    location: "Tablas, Romblon",
    area: "2.0 hectares",
    crop: "Corn",
    status: "Growing",
    plantedDate: "Sep 5, 2025",
    expectedHarvest: "Dec 10, 2025",
    image: farmThumbnail,
  },
];

interface MyFarmsProps {
  onSelectFarm?: (id: string) => void;
  onNavClick?: (tab: string) => void;
}

function MyFarms({ onSelectFarm, onNavClick }: MyFarmsProps) {
  const [farms, setFarms] = useState<FarmItem[]>(initialFarmsData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveFarm = (newFarm: any) => {
    setFarms((prev) => [
      ...prev,
      {
        ...newFarm,
        image: newFarm.image || farmThumbnail, // fall back to default only if none uploaded
      },
    ]);
    setIsModalOpen(false);
  };

  return (
    <main className="farms-page">
      <div className="farms-card">
        {/* HEADER SECTION */}
        <header className="farms-header">
          <h1 className="page-title">My Farms</h1>
          <button
            className="add-farm-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="plus-icon">+</span> Add Farm
          </button>
        </header>

        {/* FARMS LIST CONTAINER */}
        <div className="farms-list">
          {farms.map((farm) => (
            <article
              key={farm.id}
              className="farm-card"
              onClick={() => onSelectFarm && onSelectFarm(farm.id)}
            >
              <div className="farm-top-row">
                <img
                  src={farm.image || farmThumbnail}
                  alt={farm.name}
                  className="farm-img"
                />

                <div className="farm-details">
                  <div className="farm-name-row">
                    <h2 className="farm-title">{farm.name}</h2>
                    <div className="chevron-btn" aria-label="View Details">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                      </svg>
                    </div>
                  </div>

                  <p className="farm-meta">
                    <svg className="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {farm.location}
                  </p>

                  <p className="farm-meta">
                    <svg className="meta-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {farm.area}
                  </p>

                  <div className="badge-row">
                    <span className="badge badge-crop">
                      <span className="badge-icon">🌾</span> {farm.crop}
                    </span>
                    <span className="badge badge-status">
                      <span className="status-dot"></span> {farm.status}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="farm-divider" />

              <div className="farm-schedule">
                <p>Planted: <span>{farm.plantedDate}</span></p>
                <p>Expected Harvest: <span>{farm.expectedHarvest}</span></p>
              </div>
            </article>
          ))}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="bottom-nav">
          <button className="nav-item" onClick={() => onNavClick && onNavClick("Home")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Home</span>
          </button>

          <button className="nav-item active" onClick={() => onNavClick && onNavClick("Farm")}>
            <div className="active-pill">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22V12" />
                <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
                <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
              </svg>
            </div>
            <span>Farm</span>
          </button>

          <button className="nav-item" onClick={() => onNavClick && onNavClick("Tasks")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Tasks</span>
          </button>

          <button className="nav-item" onClick={() => onNavClick && onNavClick("Profile")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>
        </nav>

        {/* ADD FARM MODAL */}
        {isModalOpen && (
          <AddFarmModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveFarm}
          />
        )}
      </div>
    </main>
  );
}

export default MyFarms;
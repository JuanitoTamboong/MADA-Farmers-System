import { useState } from "react";
import "../css/MyFarms.css";
import PageLayout from "../shared/PageLayout";
import AddFarmModal from "./AddFarmModal";
import farmThumbnail from "../assets/images/farm.jfif";
// ❌ DELETED: import BottomNav from "../navigation/BottomNav";

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
  onAddFarm?: () => void;
  onSelectFarm?: (id: string) => void;
  onNavigate?: (tab: string) => void;
}

function MyFarms({ onAddFarm, onSelectFarm, onNavigate }: MyFarmsProps) {
  const [farms, setFarms] = useState<FarmItem[]>(initialFarmsData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveFarm = (newFarm: any) => {
    setFarms((prev) => [
      ...prev,
      {
        ...newFarm,
        image: newFarm.image || farmThumbnail,
      },
    ]);
    setIsModalOpen(false);
  };

  const handleAddClick = () => {
    if (onAddFarm) onAddFarm();
    else setIsModalOpen(true);
  };

  return (
    // ✅ PageLayout receives activeTab + onNavigate — the shared nav now works
    <PageLayout activeTab="Farm" onNavigate={onNavigate}>
      <div className="farms-content">
        {/* HEADER SECTION */}
        <header className="farms-header">
          <h1 className="page-title">My Farms</h1>
          <button className="add-farm-btn" onClick={handleAddClick}>
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

        {/* ❌ DELETED: <BottomNav activeTab="Farm" onNavigate={onNavigate} /> */}

        {/* ADD FARM MODAL */}
        {isModalOpen && (
          <AddFarmModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveFarm}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default MyFarms;
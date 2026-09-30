import { useState } from "react";
import PageLayout from "../shared/PageLayout";
import "../css/MarketPrices.css";

interface MarketPricesProps {
  onNavigate?: (screen: string) => void;
}

interface PriceItem {
  id: string;
  name: string;
  priceRange: string;
  trend: string;
  isPositive: boolean;
  image: string;
}

const cropItems: PriceItem[] = [
  {
    id: "1",
    name: "Palay",
    priceRange: "₱ 18 - 22 /kg",
    trend: "↑ 2%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "2",
    name: "Corn",
    priceRange: "₱ 12 - 15 /kg",
    trend: "↑ 1%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "3",
    name: "Coconut",
    priceRange: "₱ 15 - 18 /pc",
    trend: "↑ 1%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "4",
    name: "Vegetables",
    priceRange: "₱ 25 - 40 /kg",
    trend: "↑ 3%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "5",
    name: "Fruits",
    priceRange: "₱ 20 - 60 /kg",
    trend: "↑ 2%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=150&auto=format&fit=crop&q=60",
  },
];

const livestockItems: PriceItem[] = [
  {
    id: "l1",
    name: "Swine / Hogs",
    priceRange: "₱ 180 - 210 /kg",
    trend: "↑ 1%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "l2",
    name: "Chicken / Broiler",
    priceRange: "₱ 160 - 185 /kg",
    trend: "↓ 1%",
    isPositive: false,
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=150&auto=format&fit=crop&q=60",
  },
  {
    id: "l3",
    name: "Cattle / Beef",
    priceRange: "₱ 250 - 290 /kg",
    trend: "↑ 2%",
    isPositive: true,
    image: "https://images.unsplash.com/photo-1570042707223-1d0bfaeb6093?w=150&auto=format&fit=crop&q=60",
  },
];

function MarketPrices({ onNavigate }: MarketPricesProps) {
  const [activeTab, setActiveTab] = useState<"Crops" | "Livestock">("Crops");

  const itemsToDisplay = activeTab === "Crops" ? cropItems : livestockItems;

  return (
    <PageLayout activeTab="Market" onNavigate={onNavigate} hideNav>
      <div className="market-prices-container">

        {/* Top Header */}
        <header className="market-header">
          <button
            className="back-btn"
            onClick={() => onNavigate?.("Home")}
            aria-label="Go Back"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="#1B4D2E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="market-title">Market Prices</h1>
        </header>

        {/* Tab Selector */}
        <div className="market-tabs">
          <button
            className={`tab-btn ${activeTab === "Crops" ? "active" : ""}`}
            onClick={() => setActiveTab("Crops")}
          >
            Crops
          </button>
          <button
            className={`tab-btn ${activeTab === "Livestock" ? "active" : ""}`}
            onClick={() => setActiveTab("Livestock")}
          >
            Livestock
          </button>
        </div>

        {/* Price Item List */}
        <div className="price-list">
          {itemsToDisplay.map((item) => (
            <div key={item.id} className="price-card">
              <div className="item-thumbnail">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="item-details">
                <h3 className="item-name">{item.name}</h3>
                <p className="item-price">{item.priceRange}</p>
              </div>
              <div className={`item-trend ${item.isPositive ? "positive" : "negative"}`}>
                {item.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="market-disclaimer">
          Prices are based on recent market data and may vary by location.
        </p>

      </div>
    </PageLayout>
  );
}

export default MarketPrices;
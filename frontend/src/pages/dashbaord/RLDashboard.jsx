import StateVectorCard from "../../components/dashboard/StateVectorCard";
import ActionProbCard from "../../components/dashboard/ActionProbCard";
import { useState } from "react";

export default function ItemDashboard() {
  const [activeSlot, setActiveSlot] = useState("Morning");

  return (
    <div>
      <StateVectorCard
        initialSlot={activeSlot}
        onSlotChange={setActiveSlot}   // ← when user clicks a slot here...
      />
      <ActionProbCard
        activeSlot={activeSlot}        // ← ...this card updates too
      />
    </div>
  );
}
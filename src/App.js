import React, { useState } from 'react';
import MealPlannerForm from './components/MealPlannerForm';

function App() {
  return (
    <>
      <div className="header">
        <h1>AI Meal Planner</h1>
        <p>Smart weekly meal planning tailored to your lifestyle</p>
      </div>

      <div className="app-container">
        <h2 className="subtitle">Plan your week with meals that fit your lifestyle and budget</h2>
        <MealPlannerForm />
      </div>
    </>
  );
}

export default App;

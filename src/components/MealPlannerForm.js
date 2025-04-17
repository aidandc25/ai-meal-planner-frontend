
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MealPlannerForm.css'; // spinner styles

const MEAL_STYLES = [
  "Vegan", "Vegetarian", "Pescatarian", "Keto",
  "High-Protein", "Low-Carb", "Low-Fat", "High-Carb"
];

function MealPlannerForm() {
  const [form, setForm] = useState({
    mealStyles: [],
    goal: '',
    mealsPerDay: 3,
    planLength: 7,
    budget: '',
    allergies: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedPlan, setParsedPlan] = useState({ days: [], groceryList: {} });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "mealStyles") {
      setForm((prev) => ({
        ...prev,
        mealStyles: checked
          ? [...prev.mealStyles, value]
          : prev.mealStyles.filter((v) => v !== value)
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setParsedPlan({ days: [], groceryList: {} });

    try {
      const response = await fetch("https://ai-meal-planner-backend.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planLength: form.planLength,
          mealsPerDay: form.mealsPerDay,
          preferences: form.mealStyles,
          goal: form.goal,
          budget: form.budget,
          allergies: form.allergies
        })
      });

      const data = await response.json();
      if (data.result) {
        setParsedPlan(data.result);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to backend.");
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Weekly Meal Plan", 15, 15);

    let y = 25;

    parsedPlan.days.forEach((day) => {
      doc.setFont("Helvetica", "bold");
      doc.text(day.day, 15, y);
      y += 8;
      day.meals.forEach((meal) => {
        doc.setFont("Helvetica", "normal");
        doc.text(`${meal.type}: ${meal.title}`, 20, y);
        y += 7;

        if (meal.ingredients && meal.ingredients.length) {
          doc.setFontSize(12);
          doc.text(`Ingredients: ${meal.ingredients.join(", ")}`, 22, y);
          y += 7;
        }

        doc.setFontSize(12);
        meal.steps.forEach((step, i) => {
          doc.text(`- ${step}`, 24, y);
          y += 6;
        });
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Grocery List", 15, y);
    y += 8;

    Object.entries(parsedPlan.groceryList).forEach(([category, items]) => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${category}:`, 18, y);
      y += 6;

      doc.setFont("Helvetica", "normal");
      items.forEach(item => {
        doc.text(`- ${item}`, 22, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    });

    doc.save("meal-plan.pdf");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Meal Style Preferences:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {MEAL_STYLES.map(style => (
              <label key={style}>
                <input
                  type="checkbox"
                  name="mealStyles"
                  value={style}
                  checked={form.mealStyles.includes(style)}
                  onChange={handleChange}
                /> {style}
              </label>
            ))}
          </div>
        </div>

        <label>Goal:</label>
        <select name="goal" value={form.goal} onChange={handleChange}>
          <option value="">Select a goal</option>
          <option value="healthy">Eat healthier</option>
          <option value="budget">Save time & money</option>
          <option value="simple">Just plan meals</option>
        </select>

        <label>Meals Per Day:</label>
        <input type="number" name="mealsPerDay" min="1" max="3" value={form.mealsPerDay} onChange={handleChange} />

        <label>Plan Length (days):</label>
        <select name="planLength" value={form.planLength} onChange={handleChange}>
          {[3, 5, 7].map(num => <option key={num} value={num}>{num}</option>)}
        </select>

        <label>Budget Level:</label>
        <select name="budget" value={form.budget} onChange={handleChange}>
          <option value="">Select</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <label>Allergies:</label>
        <input type="text" name="allergies" value={form.allergies} onChange={handleChange} />

        <button type="submit">{loading ? "Generating..." : "Generate Meal Plan"}</button>
      </form>

      {loading && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div className="spinner" />
          <p>Generating your plan, please wait...</p>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {parsedPlan.days.length > 0 && !loading && (
        <div>
          <h3>Meal Plan:</h3>
          <button onClick={handleDownloadPDF}>Download as PDF</button>
          {parsedPlan.days.map((day, i) => (
            <div key={i} style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <h4>{day.day}</h4>
              {day.meals.map((meal, j) => (
                <div key={j}>
                  <strong>{meal.type}: {meal.title}</strong>
                  {meal.ingredients && (
                    <p><em>Ingredients:</em> {meal.ingredients.join(', ')}</p>
                  )}
                  <ul>
                    {meal.steps.map((step, k) => <li key={k}>{step}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          <h3>Grocery List:</h3>
          {Object.entries(parsedPlan.groceryList).map(([category, items], idx) => (
            <div key={idx}>
              <strong>{category}</strong>
              <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MealPlannerForm;

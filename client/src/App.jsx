import React from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { UsersProvider } from "./UsersContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddExpense from "./pages/AddExpense.jsx";
import Expenses from "./pages/Expenses.jsx";
import SettleUp from "./pages/SettleUp.jsx";

const navLinkClass = ({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "");

export default function App() {
  return (
    <UsersProvider>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">💸 Splitup</h1>
          <nav className="app-nav">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/add" className={navLinkClass}>
              Add Expense
            </NavLink>
            <NavLink to="/expenses" className={navLinkClass}>
              Expenses
            </NavLink>
            <NavLink to="/settle" className={navLinkClass}>
              Settle Up
            </NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settle" element={<SettleUp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </UsersProvider>
  );
}

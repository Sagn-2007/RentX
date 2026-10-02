# RentX - Buy Nothing, Rent Everything

RentX is a general-purpose peer-to-peer rental marketplace for physical goods. It is designed around hyperlocal rentals to facilitate trust and verification.

## Current Project Status
- **Current Phase**: Phase 0 (Scaffolding)
- **Status**: IN PROGRESS

## Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (for future phases)

## Setup and Installation

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Run the backend (Development):
   ```bash
   npm run dev
   ```
The backend health endpoint should be available at `http://localhost:3001/api/health`.

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the frontend (Development):
   ```bash
   npm run dev
   ```
The frontend should be accessible at `http://localhost:3000`.

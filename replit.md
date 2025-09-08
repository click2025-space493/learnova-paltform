# Overview

Learnova is a comprehensive SaaS educational platform that connects teachers and students through course creation and enrollment. The platform features role-based access control with three user types: admins who manage the entire system, teachers who create and manage courses with subscription-based access, and students who browse and enroll in courses. The system is built as a full-stack web application with a React frontend and Express backend, supporting video course delivery, payment processing, and progress tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **Routing**: Wouter for client-side navigation with role-based route protection
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build System**: Vite with custom configuration for development and production builds

## Backend Architecture  
- **Framework**: Express.js with TypeScript for the REST API
- **Database Layer**: Drizzle ORM with PostgreSQL, using Neon serverless database
- **Authentication**: Replit-based OpenID Connect authentication with session management
- **Session Storage**: PostgreSQL-backed session store with connect-pg-simple
- **API Design**: RESTful endpoints with role-based access control middleware
- **Error Handling**: Centralized error handling with structured error responses

## Data Storage Solutions
- **Primary Database**: PostgreSQL (Neon serverless) for all application data
- **Schema Management**: Drizzle ORM with TypeScript schema definitions and migrations
- **Session Storage**: PostgreSQL sessions table for authentication state
- **Database Structure**: Comprehensive schema including users, courses, lessons, enrollments, subscriptions, and progress tracking
- **Data Relationships**: Well-defined foreign key relationships between entities with proper indexing

## Authentication and Authorization
- **Authentication Provider**: Replit OpenID Connect integration with automatic user provisioning
- **Session Management**: Server-side sessions with PostgreSQL storage and configurable TTL
- **Role-Based Access**: Three-tier user roles (admin, teacher, student) with route-level protection
- **Authorization Middleware**: Custom middleware for protecting API endpoints based on user roles
- **Security Features**: CSRF protection, secure session cookies, and role validation

## External Dependencies
- **Database**: Neon PostgreSQL serverless database with WebSocket support
- **Authentication**: Replit OIDC provider for user authentication and identity management
- **Development Tools**: Replit-specific development tools including error overlays and cartographer
- **UI Components**: Radix UI primitives for accessible, unstyled component foundation
- **Styling**: Tailwind CSS with custom design system and dark mode support
- **Type Safety**: Comprehensive TypeScript setup with strict configuration and path mapping
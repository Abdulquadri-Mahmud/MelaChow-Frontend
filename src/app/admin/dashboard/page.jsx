"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion } from "framer-motion";
import {
    FolderTree,
    Store,
    Users,
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, change, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {label}
                </p>
                <h3 className="text-3xl font-black text-gray-900">{value}</h3>
                {change && (
                    <p className={`text-sm font-medium mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '+' : ''}{change}% from last month
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" strokeWidth={2.5} />
            </div>
        </div>
    </motion.div>
);

export default function AdminDashboardPage() {
    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-black text-gray-900 mb-2">
                            Welcome to Admin Dashboard
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Manage your GrubDash platform from here
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={FolderTree}
                            label="Total Categories"
                            value="24"
                            change={8}
                            color="bg-blue-500"
                        />
                        <StatCard
                            icon={Store}
                            label="Total Vendors"
                            value="156"
                            change={12}
                            color="bg-orange-500"
                        />
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value="2,847"
                            change={15}
                            color="bg-purple-500"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Total Orders"
                            value="5,234"
                            change={-3}
                            color="bg-green-500"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pending Approvals */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 border border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-gray-900">Pending Approvals</h3>
                                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                                    8 New
                                </span>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                                <Store size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">Vendor Name {i}</p>
                                                <p className="text-xs text-gray-500">Registered 2 days ago</p>
                                            </div>
                                        </div>
                                        <Clock size={16} className="text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 border border-gray-200"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: CheckCircle, text: "Vendor approved", time: "5 min ago", color: "text-green-500" },
                                    { icon: FolderTree, text: "Category created", time: "1 hour ago", color: "text-blue-500" },
                                    { icon: AlertCircle, text: "Vendor suspended", time: "3 hours ago", color: "text-red-500" },
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                        <activity.icon size={20} className={activity.color} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{activity.text}</p>
                                            <p className="text-xs text-gray-500">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Getting Started Guide */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
                    >
                        <h3 className="text-2xl font-black mb-4">Quick Start Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <FolderTree size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Manage Categories</h4>
                                <p className="text-sm text-orange-100">
                                    Create and organize food categories for your platform
                                </p>
                            </div>
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <Store size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Approve Vendors</h4>
                                <p className="text-sm text-orange-100">
                                    Review and approve vendor applications
                                </p>
                            </div>
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <TrendingUp size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Monitor Growth</h4>
                                <p className="text-sm text-orange-100">
                                    Track platform metrics and user engagement
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

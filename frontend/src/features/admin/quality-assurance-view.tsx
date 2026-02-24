import { motion } from 'framer-motion';
import { BarChart3, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

const QualityAssuranceView: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'SLA Compliance', value: '98.4%', trend: '+12%', icon: CheckCircle, color: 'highlight', trendColor: 'text-green-400' },
                    { label: 'User Satisfaction', value: '4.8/5.0', trend: '+5%', icon: TrendingUp, color: 'blue-500', trendColor: 'text-green-400' },
                    { label: 'Avg. Resolution Time', value: '4.2h', trend: '-2%', icon: AlertCircle, color: 'purple-500', trendColor: 'text-red-400' }
                ].map((item, idx) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-${item.color}/20 rounded-xl text-${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <span className={`text-sm font-bold ${item.trendColor}`}>{item.trend} vs last month</span>
                        </div>
                        <h3 className="text-stone-400 font-bold text-sm uppercase tracking-widest">{item.label}</h3>
                        <p className="text-3xl font-bold text-white mt-1">{item.value}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 size={24} className="text-highlight" />
                    Quality Metrics Overview
                </h2>
                <div className="space-y-6">
                    {[
                        { label: 'Content Accuracy', value: 95, color: 'bg-green-500' },
                        { label: 'Babalawo Response Rate', value: 92, color: 'bg-highlight' },
                        { label: 'Booking Success Rate', value: 99, color: 'bg-blue-500' },
                        { label: 'Platform Stability', value: 99.9, color: 'bg-purple-500' }
                    ].map(metric => (
                        <div key={metric.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-300 font-medium">{metric.label}</span>
                                <span className="text-white font-bold">{metric.value}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metric.value}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full ${metric.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default QualityAssuranceView;

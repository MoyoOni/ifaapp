import { motion } from 'framer-motion';
import { Activity, Shield, Server, Database, Zap, HardDrive } from 'lucide-react';

const PlatformHealthView: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'API Uptime', value: '99.99%', icon: Server, color: 'text-green-400', bg: 'bg-green-400/10' },
                    { label: 'DB Latency', value: '45ms', icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Error Rate', value: '0.02%', icon: Zap, color: 'text-highlight', bg: 'bg-highlight/10' },
                    { label: 'Disk Usage', value: '62%', icon: HardDrive, color: 'text-purple-400', bg: 'bg-purple-400/10' }
                ].map(item => (
                    <motion.div
                        key={item.label}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{item.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{item.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-highlight" />
                        Infrastructure Status
                    </h2>
                    <div className="space-y-4">
                        {[
                            { name: 'US-East Production', status: 'Operational', color: 'bg-green-500' },
                            { name: 'Global CDN (Vercel)', status: 'Operational', color: 'bg-green-500' },
                            { name: 'PostgreSQL Primary', status: 'Healthy', color: 'bg-green-500' },
                            { name: 'Redis Cache Layer', status: 'Healthy', color: 'bg-green-500' },
                            { name: 'Auth Service (Clerk)', status: 'Operational', color: 'bg-green-500' }
                        ].map(shard => (
                            <div key={shard.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm text-stone-300">{shard.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white opacity-60 uppercase">{shard.status}</span>
                                    <div className="relative flex h-2 w-2">
                                        <motion.span
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${shard.color}`}
                                        ></motion.span>
                                        <div className={`relative inline-flex rounded-full h-2 w-2 ${shard.color}`}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-highlight" />
                        Security Posture
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">SSL Certificates</p>
                                <p className="text-xs text-stone-400 mt-1">Renewed 12 days ago • Valid for 11 months</p>
                            </div>
                            <Shield size={24} className="text-green-500" />
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">WAF Policies</p>
                                <p className="text-xs text-stone-400 mt-1">Filtering 2.4k malicious requests/month</p>
                            </div>
                            <Activity size={24} className="text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformHealthView;

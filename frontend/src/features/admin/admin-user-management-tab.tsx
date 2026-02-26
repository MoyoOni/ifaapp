import React, { useState } from 'react';
import { Users, LogIn } from 'lucide-react';
import { AdminUser } from './admin-shared-components';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';

interface AdminUserManagementTabProps {
    users: AdminUser[];
    usersLoading: boolean;
    onImpersonate: (userId: string) => void;
}

const AdminUserManagementTab: React.FC<AdminUserManagementTabProps> = ({
    users,
    usersLoading,
    onImpersonate,
}) => {
    const [showAll, setShowAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Filter users based on search term and role filter
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            <h2 className="text-[1.25rem] font-[700] text-foreground flex items-center gap-2">
                <Users size={24} />
                User Management
            </h2>
            
            <div className="bg-card p-6 rounded-xl border border-input">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-[0.875rem]"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="text-[0.875rem]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="" className="text-[0.875rem]">All Roles</SelectItem>
                            <SelectItem value="client" className="text-[0.875rem]">Client</SelectItem>
                            <SelectItem value="babalawo" className="text-[0.875rem]">Babalawo</SelectItem>
                            <SelectItem value="admin" className="text-[0.875rem]">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-input">
                                    <th className="text-left py-3 text-[0.875rem] text-muted-foreground font-[500]">User</th>
                                    <th className="text-left py-3 text-[0.875rem] text-muted-foreground font-[500]">Role</th>
                                    <th className="text-left py-3 text-[0.875rem] text-muted-foreground font-[500]">Status</th>
                                    <th className="text-left py-3 text-[0.875rem] text-muted-foreground font-[500]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-input last:border-b-0">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                {/* Assuming we have an avatar URL in user object */}
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    <span className="text-[0.75rem] font-[500] text-muted-foreground">
                                                        {user.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-[0.875rem] font-[500] text-foreground">{user.name}</p>
                                                    <p className="text-[0.75rem] text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-[0.75rem] font-[700] ${
                                                user.role === 'client' 
                                                    ? 'bg-primary text-primary-foreground' 
                                                    : user.role === 'babalawo'
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'bg-destructive text-destructive-foreground'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-[0.75rem] font-[700] ${
                                                user.verified 
                                                    ? 'bg-success text-success-foreground' 
                                                    : 'bg-warning text-warning-foreground'
                                            }`}>
                                                {user.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => onImpersonate(user.id)}
                                            >
                                                Impersonate
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-[0.875rem] text-muted-foreground">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManagementTab;

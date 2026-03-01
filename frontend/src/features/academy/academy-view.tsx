import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, GraduationCap, Play, Clock, CheckCircle, Users, Filter } from 'lucide-react';
import { FeatureHeader } from '@/shared/components/feature-header';
import { PageTransition } from '@/components/common/page-transition';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { isDemoMode } from '@/shared/config/demo-mode';
import { getAllCourses } from './course-data';
import { AcademySkeleton } from '@/shared/components/skeleton';

interface Course {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: string;
  duration?: number;
  price: number;
  currency: string;
  status: string;
  enrolledCount: number;
  lessonCount: number;
  certificateEnabled: boolean;
  instructor: {
    id: string;
    name: string;
    yorubaName?: string;
    verified: boolean;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface AcademyViewProps {
  onSelectCourse?: (courseId: string) => void;
}

// Import courses from course-data.ts
const DEMO_COURSES: Course[] = getAllCourses();

/**
 * Academy View Component
 * Course catalog and learning dashboard
 * NOTE: All courses require Community Advisory Council approval
 */
const AcademyView: React.FC<AcademyViewProps> = ({ onSelectCourse }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate(); // Add navigate hook

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['academy-courses', selectedCategory, selectedLevel, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        const response = await api.get(`/academy/courses?${params.toString()}`);
        return response.data;
      } catch (e) {
        if (!isDemoMode) throw e;


        logger.error('Failed to fetch courses, using demo data', e);
        return selectedCategory === 'all'
          ? DEMO_COURSES
          : DEMO_COURSES.filter((course) => course.category === selectedCategory);
      }
    },
  });

  const categories = [
    { id: 'all', name: 'All Courses', icon: '📚' },
    { id: 'foundational', name: 'Foundational', icon: '🌱' },
    { id: 'spiritual_practice', name: 'Spiritual Practice', icon: '🙏' },
    { id: 'ifa_divination', name: 'Ifa Divination', icon: '🔮' },
    { id: 'orisha_studies', name: 'Orisha Studies', icon: '🌺' },
    { id: 'herbalism_healing', name: 'Herbalism & Healing', icon: '🌿' },
    { id: 'advanced_priestly', name: 'Advanced Priestly', icon: '⚡' },
    { id: 'cultural_studies', name: 'Cultural Studies', icon: '🏛️' },
  ];

  const filteredCourses = courses.filter((course) => {
    if (selectedLevel !== 'all' && course.level !== selectedLevel) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Header */}
          <FeatureHeader feature="academy" title="Ìlú Àṣẹ Academy" subtitle="Explore the wisdom of Ifá and Yoruba traditions through our curated collection of courses" icon={GraduationCap} />

          {/* Filters and Search */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input 
                placeholder="Search courses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured Course */}
          {filteredCourses.length > 0 && (
            <div 
              className="mb-12 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 p-8 border border-border cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(`/academy/course/${filteredCourses[0].id}`)}
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-3">
                    Featured Course
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{filteredCourses[0].title}</h2>
                  <p className="text-muted-foreground mb-4">{filteredCourses[0].description}</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="text-primary" size={16} />
                      <span className="text-sm text-muted-foreground">{filteredCourses[0]._count.enrollments} enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-primary" size={16} />
                      <span className="text-sm text-muted-foreground">{filteredCourses[0].duration || 2}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-primary" size={16} />
                      <span className="text-sm text-muted-foreground">{filteredCourses[0]._count.lessons} lessons</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/10 p-6 rounded-2xl">
                  <BookOpen className="text-primary" size={64} />
                </div>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          {coursesLoading ? (
            <AcademySkeleton />
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="text-muted-foreground m-4" size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No courses found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => { 
                  setSelectedCategory('all'); 
                  setSelectedLevel('all'); 
                  setSearchQuery(''); 
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    // Call the prop callback if provided (for backward compatibility)
                    onSelectCourse?.(course.id);
                    // Navigate to the course detail page
                    navigate(`/academy/course/${course.id}`);
                  }}
                  className="group bg-card rounded-2xl border border-input shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                >
                  {/* Thumbnail */}
                  <div className="relative h-56 bg-muted overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <BookOpen className="text-muted-foreground" size={48} />
                      </div>
                    )}

                    {/* Badges/Tags */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      {course.certificateEnabled && (
                        <Badge className="bg-accent text-accent-foreground text-[0.625rem] font-[700] uppercase tracking-wider px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                          <CheckCircle size={10} /> Certified
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-[0.625rem] font-[700] uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${
                          course.level === 'BEGINNER' ? 'bg-success text-success-foreground' :
                          course.level === 'INTERMEDIATE' ? 'bg-primary text-primary-foreground' :
                          'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {course.level}
                      </Badge>
                    </div>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center text-primary scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Play size={32} className="ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[0.625rem] font-[700] text-primary">
                        {course.instructor.name.charAt(0)}
                      </div>
                      <span className="text-[0.75rem] font-[700] text-primary uppercase tracking-wide">
                        {course.instructor.name}
                      </span>
                      {course.instructor.verified && (
                        <CheckCircle size={10} className="text-primary" />
                      )}
                    </div>

                    <h3 className="text-[1.25rem] font-[700] text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-foreground text-sm line-clamp-2 mb-6">
                      {course.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-input">
                      <div className="flex items-center gap-4 text-[0.875rem] font-[500] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{course.duration || 2}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen size={14} />
                          <span>{course.lessonCount}</span>
                        </div>
                      </div>

                      <div className="text-[1.125rem] font-[700] text-foreground">
                        {course.price === 0 ? 'Free' : (
                          <>{course.currency === 'NGN' ? '₦' : '$'}{course.price.toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AcademyView;
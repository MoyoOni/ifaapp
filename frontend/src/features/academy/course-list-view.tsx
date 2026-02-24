import React, { useState } from 'react';
import { BookOpen, Play, Users, Clock, Star, Search, Filter } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  rating: number;
  enrolled: number;
  thumbnail?: string;
  modules: number;
  lessons: number;
}

const CourseListView: React.FC = () => {
  const [courses, _setCourses] = useState<Course[]>([
    {
      id: '1',
      title: 'Introduction to Ifa Divination',
      description: 'Learn the fundamentals of Ifa divination including the significance of odu, the cowrie shells, and basic interpretations.',
      instructor: 'Babalawo Adeyemi',
      duration: '6 weeks',
      level: 'beginner',
      category: 'Divination',
      rating: 4.8,
      enrolled: 124,
      modules: 8,
      lessons: 32
    },
    {
      id: '2',
      title: 'Yoruba Language for Spiritual Practice',
      description: 'Master essential Yoruba vocabulary and phrases used in Ifa ceremonies and spiritual communication.',
      instructor: 'Chief Folake Ogunleye',
      duration: '4 weeks',
      level: 'beginner',
      category: 'Language',
      rating: 4.6,
      enrolled: 98,
      modules: 6,
      lessons: 24
    },
    {
      id: '3',
      title: 'Advanced Odu Interpretation',
      description: 'Deep dive into the complexities of Ifa Odu interpretation with practical case studies.',
      instructor: 'Babalawo Salami',
      duration: '10 weeks',
      level: 'advanced',
      category: 'Divination',
      rating: 4.9,
      enrolled: 76,
      modules: 12,
      lessons: 48
    },
    {
      id: '4',
      title: 'Traditional Healing Herbs',
      description: 'Explore the medicinal properties of herbs used in traditional Ifa healing practices.',
      instructor: 'Alata Okafor',
      duration: '8 weeks',
      level: 'intermediate',
      category: 'Healing',
      rating: 4.7,
      enrolled: 112,
      modules: 10,
      lessons: 40
    },
    {
      id: '5',
      title: 'Ifa Ethics and Philosophy',
      description: 'Understand the moral principles and philosophical foundations of Ifa practice.',
      instructor: 'Dr. Wande Abimbola',
      duration: '5 weeks',
      level: 'intermediate',
      category: 'Philosophy',
      rating: 4.9,
      enrolled: 89,
      modules: 7,
      lessons: 28
    },
    {
      id: '6',
      title: 'Ceremonial Practices and Rituals',
      description: 'Learn the proper procedures for conducting Ifa ceremonies and rituals.',
      instructor: 'Babalawo Alao',
      duration: '7 weeks',
      level: 'intermediate',
      category: 'Rituals',
      rating: 4.5,
      enrolled: 67,
      modules: 9,
      lessons: 36
    },
    {
      id: '7',
      title: 'Sacred Geometry in Ifa',
      description: 'Explore the geometric patterns and symbols used in Ifa divination and their meanings.',
      instructor: 'Prof. Bolaji Olupona',
      duration: '6 weeks',
      level: 'advanced',
      category: 'Symbolism',
      rating: 4.8,
      enrolled: 54,
      modules: 8,
      lessons: 32
    },
    {
      id: '8',
      title: 'Women in Ifa Traditions',
      description: 'Examine the role and contributions of women in traditional Ifa practices.',
      instructor: 'Iya Alaga',
      duration: '5 weeks',
      level: 'beginner',
      category: 'Culture',
      rating: 4.7,
      enrolled: 103,
      modules: 6,
      lessons: 24
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const categories = ['all', ...new Set(courses.map(course => course.category))];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Academy
          </h1>
          <p className="text-stone-600">
            Expand your knowledge of Ifa traditions and practices
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-2">
            <BookOpen size={18} /> My Courses
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 border border-stone-300 rounded-xl flex items-center gap-2 hover:bg-stone-50">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Course Count */}
      <div className="flex items-center justify-between">
        <p className="text-stone-600">
          Showing <span className="font-bold">{filteredCourses.length}</span> of <span className="font-bold">{courses.length}</span> courses
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-r from-primary/20 to-emerald-100 relative">
                {/* Placeholder for thumbnail */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={48} className="text-white/30" />
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">{course.title}</h3>
                    <p className="text-stone-600 text-sm mt-1">by {course.instructor}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                
                <p className="text-stone-600 mt-3 text-sm line-clamp-2">
                  {course.description}
                </p>
                
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex justify-between text-sm text-stone-600">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {course.enrolled}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="flex items-center gap-1 text-sm text-stone-600">
                      <BookOpen size={14} /> {course.modules} modules
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < Math.floor(course.rating) ? "#fbbf24" : "none"} 
                          stroke="#fbbf24" 
                          className={i < Math.floor(course.rating) ? "fill-yellow-400" : "fill-none"}
                        />
                      ))}
                      <span className="text-sm text-stone-600 ml-1">{course.rating}</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-4 py-2.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors">
                  Enroll Now
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
            <BookOpen size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No courses found</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'all' || levelFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No courses match your search criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseListView;
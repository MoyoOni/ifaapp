import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoGuideGallery from './video-guide-gallery';
import { VideoGuide } from './video-guide-gallery';

// Mock video data
const mockVideos: VideoGuide[] = [
  {
    id: '1',
    title: 'Introduction to Ifá',
    description: 'Learn the basics of Ifá divination',
    duration: '12:30',
    thumbnail: 'https://example.com/thumb1.jpg',
    videoUrl: 'https://example.com/video1.mp4',
    category: 'Introduction',
    difficulty: 'beginner',
    completed: false,
    progress: 0,
    instructor: 'Chief Babatunde',
    views: 1250
  },
  {
    id: '2',
    title: 'Advanced Ifá Interpretation',
    description: 'Deep dive into interpreting Ifá verses',
    duration: '25:45',
    thumbnail: 'https://example.com/thumb2.jpg',
    videoUrl: 'https://example.com/video2.mp4',
    category: 'Advanced',
    difficulty: 'advanced',
    completed: true,
    progress: 100,
    instructor: 'Babalawo Adunni',
    views: 876,
    rating: 4.7
  }
];

describe('VideoGuideGallery', () => {
  test('renders video items correctly', () => {
    render(<VideoGuideGallery videos={mockVideos} />);
    
    // Check if both video titles are rendered
    expect(screen.getByText('Introduction to Ifá')).toBeInTheDocument();
    expect(screen.getByText('Advanced Ifá Interpretation')).toBeInTheDocument();
    
    // Check if descriptions are rendered
    expect(screen.getByText('Learn the basics of Ifá divination')).toBeInTheDocument();
    expect(screen.getByText('Deep dive into interpreting Ifá verses')).toBeInTheDocument();
    
    // Check if difficulty badges are rendered
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  test('applies category filter correctly', () => {
    render(<VideoGuideGallery videos={mockVideos} categoryFilter="Advanced" />);
    
    // Only the advanced video should be shown
    expect(screen.queryByText('Advanced Ifá Interpretation')).toBeInTheDocument();
    expect(screen.queryByText('Introduction to Ifá')).not.toBeInTheDocument();
  });

  test('shows completed indicator for completed videos', () => {
    render(<VideoGuideGallery videos={mockVideos} />);
    
    // Check that the completed video has the checkmark
    const completedVideo = screen.getByText('Advanced Ifá Interpretation').closest('.group');
    expect(completedVideo).toHaveClass('ring-2');
  });

  test('calls onVideoSelect when video is clicked', () => {
    const mockOnVideoSelect = vi.fn();
    render(<VideoGuideGallery videos={mockVideos} onVideoSelect={mockOnVideoSelect} />);
    
    const videoElement = screen.getByText('Introduction to Ifá');
    fireEvent.click(videoElement);
    
    expect(mockOnVideoSelect).toHaveBeenCalledTimes(1);
    expect(mockOnVideoSelect).toHaveBeenCalledWith(mockVideos[0]);
  });

  test('toggles play state when play button is clicked', () => {
    render(<VideoGuideGallery videos={mockVideos} />);

    // Initially no video should be playing
    const playButtons = screen.getAllByLabelText('Play');
    expect(playButtons).toHaveLength(2);

    // Click the first play button
    fireEvent.click(playButtons[0]);

    // The clicked video's button swaps to Pause; the other video is unaffected
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Play')).toHaveLength(1);

    // Clicking it again toggles back to Play
    fireEvent.click(screen.getByLabelText('Pause'));
    expect(screen.getAllByLabelText('Play')).toHaveLength(2);
  });
});
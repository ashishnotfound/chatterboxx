import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/user-avatar';
import { User } from '@/types/chat';
import { Plus } from 'lucide-react';
import { Story } from '@/hooks/useStories';

interface StoryCirclesProps {
  users: User[];
  stories: Story[];
  onUserClick?: (user: User) => void;
  onAddStory?: () => void;
  isStealthMode?: boolean;
}

export function StoryCircles({ users, stories, onUserClick, onAddStory, isStealthMode = false }: StoryCirclesProps) {
  console.log('📖 StoryCircles - received stories:', stories);
  console.log('📖 StoryCircles - received users:', users);
  
  // Get users with stories
  const usersWithStories = users.filter(user => 
    stories.some(story => story.userId === user.id)
  );
  
  console.log('📖 StoryCircles - usersWithStories:', usersWithStories);

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:-mx-0 lg:px-0">
      <motion.div 
        className="flex gap-4 lg:gap-6 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Add Story Button */}
        <motion.div
          className="flex flex-col items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={onAddStory}
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 border-dashed border-muted-foreground/50 
                       flex items-center justify-center hover:border-primary hover:bg-primary/10 
                       transition-all duration-300"
          >
            <Plus className="w-6 h-6 lg:w-7 lg:h-7 text-muted-foreground" />
          </button>
          <span className="text-xs lg:text-sm text-muted-foreground">Add</span>
        </motion.div>

        {/* User Stories */}
        {usersWithStories.map((user, index) => {
          const userStories = stories.filter(story => story.userId === user.id);
          const hasUnviewedStory = userStories.some(story => !story.isViewed);
          
          return (
            <motion.div
              key={user.id}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * (index + 1) }}
              onClick={() => onUserClick?.(user)}
            >
              <div className="relative">
                {/* Story ring */}
                <div className={`absolute inset-0 rounded-full border-2 ${
                  hasUnviewedStory 
                    ? 'border-primary' 
                    : 'border-muted-foreground/30'
                }`} />
                
                <Avatar 
                  user={user} 
                  size="lg" 
                  isStory 
                  showOnlineStatus={false}
                />
              </div>
              <span className="text-xs lg:text-sm text-foreground/90 max-w-16 lg:max-w-20 truncate">
                {user.username}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Bot, Lightbulb, ChevronRight } from "lucide-react";
import NavigationHeader from "@/components/navigation-header";
import { apiGet } from "@/lib/api";
import type { Category, Folder, Flashcard, StudySession } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiGet("/api/categories")
  });

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
    queryFn: async () => {
      const allFolders = [];
      for (const category of categories) {
        const categoryFolders = await apiGet(`/api/folders/category/${category.id}`);
        allFolders.push(...categoryFolders);
      }
      return allFolders;
    },
    enabled: categories.length > 0
  });

  const { data: allFlashcards = [] } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards"],
    queryFn: async () => {
      const allCards = [];
      for (const folder of folders) {
        const folderCards = await apiGet(`/api/flashcards/folder/${folder.id}`);
        allCards.push(...folderCards);
      }
      return allCards;
    },
    enabled: folders.length > 0
  });

  const { data: allStudySessions = [] } = useQuery<StudySession[]>({
    queryKey: ["/api/study-sessions"],
    queryFn: async () => {
      const allSessions = [];
      for (const folder of folders) {
        try {
          const folderSessions = await apiGet(`/api/study-sessions/folder/${folder.id}`);
          allSessions.push(...folderSessions);
        } catch (error) {
          // Continue if folder has no sessions
        }
      }
      return allSessions;
    },
    enabled: folders.length > 0
  });

  // Calculate today's statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = allStudySessions.filter(session => {
    if (!session.createdAt) return false;
    const sessionDate = new Date(session.createdAt);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  const totalCards = allFlashcards.length;
  const totalFolders = folders.length;
  const todayStudyTime = todaySessions.reduce((total, session) => total + Math.floor(session.duration / 60), 0);
  const cardsStudiedToday = todaySessions.reduce((total, session) => total + session.completedCards, 0);

  return (
    <div className="min-h-screen animate-fade-in">
      <NavigationHeader title="FlashBrain" />
      
      <main className="px-4 pb-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lightbulb className="text-white h-8 w-8" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Welcome to FlashBrain</h2>
          <p className="text-white/80 text-base">Smart flashcards for faster learning</p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4 mb-8">
          <Button
            onClick={() => navigate("/categories")}
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl font-semibold touch-btn card-shadow transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Flashcards Manually
          </Button>
          <Button
            onClick={() => navigate("/create-ai")}
            variant="secondary"
            className="w-full bg-white hover:bg-gray-50 text-primary py-4 px-6 rounded-xl font-semibold touch-btn card-shadow transition-all duration-300 transform hover:scale-105"
          >
            <Bot className="mr-2 h-5 w-5" />
            Generate with AI
          </Button>
        </div>

        {/* My Study Folders Section */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">My Study Folders</h3>
              <Button
                onClick={() => navigate("/categories")}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {folders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">No folders yet. Create your first category to get started!</p>
                <Button
                  onClick={() => navigate("/categories")}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {folders.slice(0, 4).map((folder) => {
                  const folderCards = allFlashcards.filter(card => card.folderId === folder.id);
                  return (
                    <Card
                      key={folder.id}
                      className={`p-4 cursor-pointer card-shadow transition-all duration-200 hover:scale-105 ${
                        folder.color === "yellow" ? "folder-yellow" :
                        folder.color === "pink" ? "folder-pink" :
                        folder.color === "blue" ? "folder-blue" :
                        folder.color === "green" ? "folder-green" :
                        "folder-white"
                      }`}
                      onClick={() => navigate(`/flashcards/${folder.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium opacity-70">
                          {categories.find(cat => cat.id === folder.categoryId)?.name}
                        </span>
                        <span className="text-xs opacity-60">
                          {folderCards.length} cards
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm">{folder.name}</h4>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Today's Progress</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white text-2xl font-bold">{cardsStudiedToday}</div>
                <div className="text-white/70 text-sm">Cards Studied</div>
              </div>
              <div>
                <div className="text-white text-2xl font-bold">{todaySessions.length}</div>
                <div className="text-white/70 text-sm">Study Sessions</div>
              </div>
              <div>
                <div className="text-white text-2xl font-bold">{todayStudyTime}m</div>
                <div className="text-white/70 text-sm">Study Time</div>
              </div>
            </div>
            {todaySessions.length === 0 && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg text-center">
                <p className="text-white/60 text-sm">No study sessions today yet. Start studying to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import { useInfiniteScroll } from "#/hooks/use-infinite-scroll";
import { RecentConversation } from "../components/features/home/recent-conversations/recent-conversation";
import { RecentConversationsSkeleton } from "../components/features/home/recent-conversations/recent-conversations-skeleton";
import { useNavigate } from "react-router";
import { BrandButton } from "#/components/features/settings/brand-button";
import { RefreshCw, Search, Users } from "lucide-react";

type SortOption = "recent" | "oldest" | "a-z" | "pinned";
type FilterOption = "all" | "shared" | "personal";

function ConversationsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
    data: conversationsList,
    isFetching,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePaginatedConversations(20);

  // Set up infinite scroll
  const scrollContainerRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 200,
  });

  const conversations = conversationsList?.pages.flatMap((page) => page.items) ?? [];

  // Filter by search query AND shared filter
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filter by shared/personal
    if (filterBy === "shared") {
      result = result.filter((conv) => conv.public === true);
    } else if (filterBy === "personal") {
      result = result.filter((conv) => !conv.public);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (conv) =>
          conv.title?.toLowerCase().includes(query) ||
          conv.selected_repository?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [conversations, searchQuery, filterBy]);

  // Sort conversations
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // Pinned first for all sorts
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "a-z":
          return (a.title || "").localeCompare(b.title || "");
        case "recent":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [filteredConversations, sortBy]);

  // Get the conversations to display based on expansion state
  const displayLimit = isExpanded ? 20 : 10;
  const displayedConversations = sortedConversations.slice(0, displayLimit);

  const hasConversations = conversations && conversations.length > 0;
  const hasMoreConversations = sortedConversations.length > displayLimit;
  const isInitialLoading = isFetching && !conversationsList;

  const handleToggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartNewConversation = () => {
    navigate("/");
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterBy(e.target.value as FilterOption);
  };

  return (
    <div
      data-testid="conversations-screen"
      className="px-0 pt-4 bg-transparent h-full flex flex-col pt-[35px] overflow-y-auto rounded-xl lg:px-[42px] lg:pt-[42px] custom-scrollbar-always"
    >
      {/* Header */}
      <header className="flex flex-col items-center gap-4 pb-6">
        <h1 className="text-2xl leading-7 text-white font-semibold">
          {t(I18nKey.COMMON$CONVERSATIONS)}
        </h1>
        {hasConversations && (
          <span className="text-sm text-[#A1A1A1]">
            {t(I18nKey.HOME$RECENT_CONVERSATIONS_COUNT, {
              count: conversations.length,
            })}
          </span>
        )}
      </header>

      {/* Controls Row: Search + Filter + Sort + Refresh */}
      <div className="flex justify-center pb-6 gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary-alt"
            size={16}
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t(I18nKey.COMMON$SEARCH)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t(I18nKey.COMMON$SEARCH)}
            className="pl-9 pr-3 py-2 w-48 bg-tertiary text-white text-sm rounded-lg border border-[#3D4148] focus:border-[#10A32F] focus:outline-none placeholder:text-tertiary-alt"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filterBy}
          onChange={handleFilterChange}
          aria-label={t(I18nKey.FILTER$SHARED)}
          className="px-3 py-2 bg-tertiary text-white text-sm rounded-lg border border-[#3D4148] focus:border-[#10A32F] focus:outline-none cursor-pointer"
        >
          <option value="all">{t(I18nKey.FILTER$ALL)}</option>
          <option value="shared">{t(I18nKey.FILTER$SHARED)}</option>
          <option value="personal">{t(I18nKey.FILTER$PERSONAL)}</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={handleSortChange}
          aria-label={t(I18nKey.SORT$LABEL)}
          className="px-3 py-2 bg-tertiary text-white text-sm rounded-lg border border-[#3D4148] focus:border-[#10A32F] focus:outline-none cursor-pointer"
        >
          <option value="recent">{t(I18nKey.SORT$RECENT)}</option>
          <option value="oldest">{t(I18nKey.SORT$OLDEST)}</option>
          <option value="a-z">{t(I18nKey.SORT$A_Z)}</option>
        </select>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 bg-tertiary text-white rounded-lg border border-[#3D4148] hover:bg-tertiary-alt focus:outline-none disabled:opacity-50 transition-colors"
          aria-label={t(I18nKey.BUTTON$REFRESH)}
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            size={16}
          />
        </button>

        {/* New Conversation Button */}
        <BrandButton
          type="button"
          variant="primary"
          onClick={handleStartNewConversation}
        >
          {t(I18nKey.COMMON$NEW_CONVERSATION)}
        </BrandButton>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center h-full pl-4">
          <p className="text-danger">{error.message}</p>
        </div>
      )}

      <div className="flex flex-col">
        {isInitialLoading && (
          <div className="pl-4">
            <RecentConversationsSkeleton />
          </div>
        )}
      </div>

      {!isInitialLoading && !error && displayedConversations?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          {searchQuery ? (
            <span className="text-sm leading-4 text-[#A1A1A1] font-medium">
              {t(I18nKey.COMMON$NO_RESULTS)}
            </span>
          ) : (
            <span className="text-sm leading-4 text-[#A1A1A1] font-medium">
              {t(I18nKey.HOME$NO_RECENT_CONVERSATIONS)}
            </span>
          )}
        </div>
      )}

      {!isInitialLoading &&
        displayedConversations &&
        displayedConversations.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar w-full max-w-[703px]">
              <div ref={scrollContainerRef} className="flex flex-col">
                {displayedConversations.map((conversation) => (
                  <RecentConversation
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

      {!isInitialLoading && (hasMoreConversations || isExpanded) && (
        <div className="flex justify-center mt-6 mb-8">
          <button
            type="button"
            onClick={handleToggleExpansion}
            className="text-sm leading-4 text-[#FAFAFA] font-normal cursor-pointer hover:underline"
          >
            {isExpanded
              ? t(I18nKey.COMMON$VIEW_LESS)
              : t(I18nKey.COMMON$VIEW_MORE)}
          </button>
        </div>
      )}
    </div>
  );
}

export default ConversationsScreen;
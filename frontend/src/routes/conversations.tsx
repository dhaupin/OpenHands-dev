import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import { useInfiniteScroll } from "#/hooks/use-infinite-scroll";
import { RecentConversation } from "../components/features/home/recent-conversations/recent-conversation";
import { RecentConversationsSkeleton } from "../components/features/home/recent-conversations/recent-conversations-skeleton";
import { useNavigate } from "react-router";

// NOTE: Translation keys are defined at the end of this file

function ConversationsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: conversationsList,
    isFetching,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedConversations(20);

  // Set up infinite scroll
  const scrollContainerRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 200,
  });

  const conversations = conversationsList?.pages.flatMap((page) => page.items) ?? [];

  // Sort: pinned conversations first, then by updated_at descending
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Get the conversations to display based on expansion state
  const displayLimit = isExpanded ? 20 : 10;
  const displayedConversations = sortedConversations.slice(0, displayLimit);

  const hasConversations = conversations && conversations.length > 0;
  const hasMoreConversations = conversations && conversations.length > displayLimit;
  const isInitialLoading = isFetching && !conversationsList;

  const handleToggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartNewConversation = () => {
    navigate("/");
  };

  return (
    <div className="px-0 pt-4 bg-transparent h-full flex flex-col pt-[35px] overflow-y-auto rounded-xl lg:px-[42px] lg:pt-[42px] custom-scrollbar-always">
      <div className="flex items-center justify-between gap-2 mb-6 px-4 lg:px-0">
        <h1 className="text-xl leading-7 text-white font-bold">
          {t(I18nKey.COMMON$CONVERSATIONS)}
        </h1>
        <button
          type="button"
          onClick={handleStartNewConversation}
          className="px-4 py-2 bg-[#10A32F] hover:bg-[#0D8B1F] text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
        >
          {t(I18nKey.COMMON$NEW_CONVERSATION)}
        </button>
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
        <span className="text-sm leading-4 text-[#A1A1A] font-medium pl-4">
          {t(I18nKey.HOME$NO_RECENT_CONVERSATIONS)}
        </span>
      )}

      {!isInitialLoading &&
        displayedConversations &&
        displayedConversations.length > 0 && (
          <div className="flex flex-col">
            <div className="transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar">
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
        <div className="flex justify-start mt-6 mb-8 ml-4">
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
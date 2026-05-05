import { useMutation, useQueryClient } from "@tanstack/react-query";
import V1ConversationService from "#/api/conversation-service/v1-conversation-service.api";

export const useToggleConversationPin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { conversationId: string; pinned: boolean }) =>
      V1ConversationService.updateConversationPinned(
        variables.conversationId,
        variables.pinned,
      ),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["user", "conversations"] });
      const previousConversations = queryClient.getQueryData(["user", "conversations"]);

      // Optimistically update the pinned status
      queryClient.setQueryData(
        ["user", "conversations"],
        (old: { id: string; pinned?: boolean }[] | undefined) =>
          old?.map((conv) =>
            conv.id === variables.conversationId
              ? { ...conv, pinned: variables.pinned }
              : conv,
          ),
      );

      // Also update paginated conversations
      queryClient.setQueryData(
        ["user", "conversations", "paginated"],
        (old: { pages: { items: { id: string; pinned?: boolean }[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((conv) =>
                conv.id === variables.conversationId
                  ? { ...conv, pinned: variables.pinned }
                  : conv,
              ),
            })),
          };
        },
      );

      return { previousConversations };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(["user", "conversations"], context.previousConversations);
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate and refetch the conversation list
      queryClient.invalidateQueries({ queryKey: ["user", "conversations"] });
    },
  });
};
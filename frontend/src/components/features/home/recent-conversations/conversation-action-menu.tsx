import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import EllipsisIcon from "#/icons/ellipsis.svg?react";
import { ContextMenu } from "#/ui/context-menu";
import { ContextMenuListItem } from "../../context-menu/context-menu-list-item";
import { I18nKey } from "#/i18n/declaration";
import { ConversationNameContextMenuIconText } from "../../../conversation/conversation-name-context-menu-icon-text";
import { useToggleConversationPin } from "#/hooks/mutation/use-toggle-conversation-pin";
import { V1AppConversation } from "#/api/conversation-service/v1-conversation-service.types";

interface ConversationActionMenuProps {
  conversation: V1AppConversation;
  onDelete?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ConversationActionMenu({
  conversation,
  onDelete,
}: ConversationActionMenuProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { mutate: togglePin } = useToggleConversationPin();

  const handleTogglePin = () => {
    togglePin({
      conversationId: conversation.id,
      pinned: !conversation.pinned,
    });
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="cursor-pointer w-6 h-6 flex flex-row items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <EllipsisIcon />
      </button>
      {menuOpen && (
        <ContextMenu
          testId="conversation-action-menu"
          position="bottom"
          alignment="right"
          className="mt-0"
          onClose={() => setMenuOpen(false)}
        >
          <ContextMenuListItem
            testId="pin-button"
            onClick={handleTogglePin}
            className="cursor-pointer p-0 h-auto hover:bg-transparent"
          >
            <ConversationNameContextMenuIconText
              icon={
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill={conversation.pinned ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 2v6m0 0l3-3m-3 3L9 5M12 22v-6m0 0l3 3m-3-3L9 19M4 12h6m0 0l3-3m-3 3L5 9M20 12h-6m0 0l3 3m-3-3L19 15" />
                </svg>
              }
              text={
                conversation.pinned
                  ? t(I18nKey.BUTTON$UNPIN)
                  : t(I18nKey.BUTTON$PIN)
              }
            />
          </ContextMenuListItem>
          {onDelete && (
            <ContextMenuListItem
              testId="delete-button"
              onClick={onDelete}
              className="cursor-pointer p-0 h-auto hover:bg-transparent"
            >
              <ConversationNameContextMenuIconText
                icon={
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                }
                text={t(I18nKey.COMMON$DELETE_CONVERSATION)}
              />
            </ContextMenuListItem>
          )}
        </ContextMenu>
      )}
    </div>
  );
}
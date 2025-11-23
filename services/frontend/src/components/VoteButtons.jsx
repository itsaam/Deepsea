import { useState, useEffect } from "react";
import { voteObservation, removeVote, getVoteStats } from "../services/api";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const VoteButtons = ({ observationId, authorId, currentUserId }) => {
  const [voteStats, setVoteStats] = useState({
    totalScore: 0,
    totalVotes: 0,
    upvotes: 0,
    downvotes: 0,
    userVote: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const isOwnObservation = authorId === currentUserId;

  useEffect(() => {
    fetchVoteStats();
  }, [observationId]);

  const fetchVoteStats = async () => {
    try {
      const response = await getVoteStats(observationId);
      setVoteStats(response.data.stats);
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
    }
  };

  const handleVote = async (value) => {
    if (isOwnObservation) {
      alert("Vous ne pouvez pas voter pour votre propre observation");
      return;
    }

    setIsLoading(true);
    try {
      // Si c'est le même vote, on le retire
      if (voteStats.userVote === value) {
        await removeVote(observationId);
      } else {
        // Sinon on vote (ou change de vote)
        await voteObservation(observationId, value);
      }
      await fetchVoteStats();
    } catch (error) {
      console.error("Erreur lors du vote:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = () => {
    if (voteStats.totalScore > 0) return "text-green-600";
    if (voteStats.totalScore < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading || isOwnObservation}
        className={`p-2 rounded-lg transition-all duration-200 ${
          voteStats.userVote === 1
            ? "bg-green-100 text-green-600 scale-110"
            : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
        } ${
          isOwnObservation ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } disabled:opacity-50`}
        title={
          isOwnObservation
            ? "Vous ne pouvez pas voter pour votre observation"
            : "Upvote"
        }
      >
        <FaArrowUp className="w-5 h-5" />
      </button>

      {/* Score Display */}
      <div className="flex flex-col items-center min-w-[60px]">
        <span className={`text-2xl font-bold ${getScoreColor()}`}>
          {voteStats.totalScore > 0 ? "+" : ""}
          {voteStats.totalScore}
        </span>
        <span className="text-xs text-gray-500">
          {voteStats.totalVotes} vote{voteStats.totalVotes !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading || isOwnObservation}
        className={`p-2 rounded-lg transition-all duration-200 ${
          voteStats.userVote === -1
            ? "bg-red-100 text-red-600 scale-110"
            : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
        } ${
          isOwnObservation ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
        } disabled:opacity-50`}
        title={
          isOwnObservation
            ? "Vous ne pouvez pas voter pour votre observation"
            : "Downvote"
        }
      >
        <FaArrowDown className="w-5 h-5" />
      </button>

      {/* Vote breakdown tooltip */}
      {voteStats.totalVotes > 0 && (
        <div className="ml-2 text-xs text-gray-500">
          <span className="text-green-600">▲{voteStats.upvotes}</span>
          {" / "}
          <span className="text-red-600">▼{voteStats.downvotes}</span>
        </div>
      )}
    </div>
  );
};

export default VoteButtons;

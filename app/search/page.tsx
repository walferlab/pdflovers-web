import SearchProductFeed from "@/modules/search/SearchFeed";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search templates, courses and guides",
}

const SearchPage = () => {
    return (
        <div>
            <SearchProductFeed />
        </div>
    );
};

export default SearchPage;
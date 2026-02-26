# X-MICRO NEWSLETTER INSTRUCTIONS

This project is dedicated to aggregating and disseminating critical news regarding the hardware market, geopolitical shifts affecting the industry, and technical updates.

## Core Directives

1.  **News Aggregation**:
    *   Use the Google Serper API to search for news related to hardware (processors, motherboards, monitors, cases, etc.).
    *   Include searches for macro trends: tariffs, sanctions, trade wars, and market shifts that could impact supply chains.
    *   Prioritize official sources, industry news sites, and reputable tech journalism.

2.  **Processing & Deduplication**:
    *   Filter out redundant news items.
    *   Ensure each unique piece of news is captured once with its primary source URL.
    *   Extract the publication date and categorize the news (e.g., "Macro Economic," "Component Update," "Supply Chain").

3.  **Newsletter Formatting**:
    *   Generate a summary for each news item.
    *   Format the output as a clean, markdown-based newsletter.
    *   Include a table of contents if the number of items exceeds 10.
    *   Each item must have a clear title, a brief summary, and a direct link to the source.

4.  **Operational Rules**:
    *   DO NOT use background terminal processes for long-running tasks.
    *   All database updates (if any) must be performed synchronously.
    *   Maintain a `news_history.csv` or similar to prevent re-reporting old news in future editions.

## Ready for Instructions
When the USER provides a specific topic or a command to "generate newsletter," follow the procedures outlined above.

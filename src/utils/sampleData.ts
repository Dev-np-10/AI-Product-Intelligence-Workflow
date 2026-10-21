/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const HEALTHY_VOICE_REVIEWS_CSV = `review_id,date,review_text,rating,platform,user_type,sentiment
REV-101,2026-10-18,"Advanced Voice mode is mindblowing when practicing Spanish, but why was I abruptly cut off after 20 minutes? I pay $20/month for Plus specifically for voice and thought it was unlimited.",3,iOS,Plus Subscriber,neutral
REV-102,2026-10-19,"Super impressed with the conversational latency and natural breaths. Easily the best voice AI on iOS right now.",5,iOS,Plus Subscriber,positive
REV-103,2026-10-17,"Charged $20/month for ChatGPT Plus thinking Voice Mode has no hourly cap. Hit the daily voice limit while in the middle of a client brainstorm with zero advance countdown timer.",2,Android,Plus Subscriber,negative
REV-104,2026-10-19,"Why does the mobile app keep interrupting me whenever I take a 1-second pause to think? I have to constantly mute/unmute to finish a sentence.",2,iOS,Free User,negative
REV-105,2026-10-18,"The voice feature is great for hands-free driving commutes. Reads summaries effortlessly and follows up smoothly.",5,Android,Plus Subscriber,positive
REV-106,2026-10-16,"Subscription tier confusion is real. The app says advanced voice is available, but when I tap it asks to upgrade to Plus, and then says daily voice quota applies anyway. Clarify what $20 gets us!",2,iOS,Free User,negative
REV-107,2026-10-19,"Love the Cove voice option. Feels like talking to a real tutor. However, battery drain is noticeable after 15 minutes of continuous voice chat.",4,Android,Plus Subscriber,positive
REV-108,2026-10-15,"Paid $20 expecting full Voice access all day. Instead got a sudden pop-up: 'You've reached your daily limit for Advanced Voice. Voice will resume at 8:00 PM.' Very disappointing for paying users.",1,iOS,Plus Subscriber,negative
REV-109,2026-10-17,"The voice mode frequently mistakes background television chatter for my speech and goes off on a wild tangent.",2,iOS,Plus Subscriber,negative
REV-110,2026-10-19,"Incredible tool for interview rehearsal. The natural speech pauses and emotional inflections are unmatched.",5,Android,Plus Subscriber,positive
REV-111,2026-10-16,"I bought the annual subscription through App Store believing voice was completely uncapped. The billing breakdown should explicitly disclose the dynamic rate limits on voice minutes.",2,iOS,Plus Subscriber,negative
REV-112,2026-10-18,"Voice recognition struggles heavily with strong Scottish and non-native accents. Keeps misinterpreting technical jargon.",3,Android,Free User,neutral
REV-113,2026-10-20,"Voice mode suddenly disconnected during my language tutoring session and claimed network error, then wouldn't reconnect for 10 minutes.",2,iOS,Plus Subscriber,negative
REV-114,2026-10-17,"Clean audio fidelity and seamless bilingual switching between French and English. Outstanding product engineering.",5,iOS,Plus Subscriber,positive
REV-115,2026-10-15,"Voice quota resets at an arbitrary hour instead of giving a live fuel gauge. If I am billed $20 monthly, show a countdown meter!",2,Android,Plus Subscriber,negative`;

export const MALFORMED_DIRTY_REVIEWS_CSV = `review_id,date,review_text,rating,platform,user_type,sentiment
REV-D01,2026-10-19,"Advanced Voice is great but cut off unexpectedly.",3,iOS,Plus Subscriber,neutral
REV-D01,2026-10-19,"Advanced Voice is great but cut off unexpectedly.",3,iOS,Plus Subscriber,neutral
REV-D02,NOT_A_VALID_DATE,"Voice mode works fine on Android.",4,Android,Free User,positive
REV-D03,99/99/9999,"<script>alert('xss')</script>Sudden cutoffs without countdown meter.",1,iOS,Plus Subscriber,negative
REV-D04,2026-10-18,,1,Android,Free User,negative
REV-D05,2026-10-17,"=cmd|' /C calc'!A0 App keeps crashing during voice calls.",2,Android,Plus Subscriber,negative
REV-D06,2026-10-16,"Charged monthly subscription fee without clear voice usage cap disclosure.",2,iOS,Plus Subscriber,negative`;

export const MISSING_COLUMNS_CSV = `id,content,user_stars
REV-M1,"Voice is great",5
REV-M2,"Audio lags",2`;

export const INSUFFICIENT_FEE_EVIDENCE_CSV = `review_id,date,review_text,rating,platform,user_type,sentiment
REV-Q01,2026-10-19,"The voice feature is fantastic for hands-free driving commutes.",5,iOS,Free User,positive
REV-Q02,2026-10-18,"Voice audio sounds slightly robotic on low bandwidth connections.",3,Android,Free User,neutral
REV-Q03,2026-10-17,"The latency is surprisingly fast compared to old Siri.",4,iOS,Free User,positive
REV-Q04,2026-10-16,"App interrupts me when I pause for more than half a second.",2,Android,Free User,negative
REV-Q05,2026-10-15,"Great conversational AI, very helpful for interview prep.",5,iOS,Free User,positive`;

export const EMPTY_CSV = ``;

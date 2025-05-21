'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Complete list of resources with tags
const resourcesData = [
  { 
    id: 1, 
    title: "Understanding Anxiety: A Comprehensive Guide", 
    category: "Article", 
    link: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
    tags: ["anxiety", "mental health", "education"],
    conditions: ["anxiety"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 2, 
    title: "Meditation for Beginners", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=inpok4MKVLM",
    tags: ["meditation", "mindfulness", "relaxation"],
    approaches: ["mindfulness"],
    severity: ["mild"]
  },
  { 
    id: 3, 
    title: "Stress Management Techniques: Tips and Tools", 
    category: "Article", 
    link: "https://www.helpguide.org/articles/stress/stress-management.htm",
    tags: ["stress", "coping", "self-help"],
    conditions: ["stress", "anxiety"],
    approaches: ["cbt", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 4, 
    title: "Sleep Hygiene Tips", 
    category: "Article", 
    link: "https://www.sleepfoundation.org/sleep-hygiene",
    tags: ["sleep", "insomnia", "health"],
    conditions: ["insomnia", "depression"],
    approaches: ["self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 5, 
    title: "Cognitive Behavioral Therapy Explained", 
    category: "Article", 
    link: "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral",
    tags: ["cbt", "therapy", "mental health"],
    approaches: ["cbt"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 6, 
    title: "Mood Tracker App Review", 
    category: "Tool", 
    link: "https://www.verywellmind.com/best-mood-tracking-apps-4177953",
    tags: ["mood", "apps", "self-monitoring"],
    approaches: ["self-care", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 7, 
    title: "Mindfulness Meditation", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=6p_yaNFSYao",
    tags: ["mindfulness", "meditation", "relaxation"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 8, 
    title: "Mental Health America Resources", 
    category: "Article", 
    link: "https://www.mhanational.org",
    tags: ["resources", "mental health", "support"],
    conditions: ["depression", "anxiety", "bipolar"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 9, 
    title: "Anxiety and Depression Association of America", 
    category: "Article", 
    link: "https://adaa.org",
    tags: ["anxiety", "depression", "resources"],
    conditions: ["anxiety", "depression"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 10, 
    title: "Mental Health First Aid", 
    category: "Tool", 
    link: "https://www.mentalhealthfirstaid.org",
    tags: ["first aid", "crisis", "support"],
    conditions: ["crisis"],
    severity: ["severe"]
  },
  { 
    id: 11, 
    title: "Self-care Practices for Mental Health", 
    category: "Article", 
    link: "https://psychcentral.com/health/self-care",
    tags: ["self-care", "wellness", "mental health"],
    approaches: ["self-care"],
    severity: ["mild"]
  },
  { 
    id: 12, 
    title: "7 Tips for Better Mental Health", 
    category: "Article", 
    link: "https://www.verywellmind.com/tips-for-better-mental-health-3144881",
    tags: ["tips", "mental health", "wellness"],
    approaches: ["self-care"],
    severity: ["mild"]
  },
  { 
    id: 13, 
    title: "Yoga for Mental Health", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=v7AYKMP6rOE",
    tags: ["yoga", "exercise", "mindfulness"],
    approaches: ["mindfulness", "exercise"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 14, 
    title: "Art Therapy Explained", 
    category: "Article", 
    link: "https://www.healthline.com/health/art-therapy",
    tags: ["art therapy", "creativity", "expression"],
    approaches: ["art therapy"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 15, 
    title: "Understanding Depression", 
    category: "Article", 
    link: "https://www.webmd.com/depression/guide/what-is-depression",
    tags: ["depression", "mental health", "education"],
    conditions: ["depression"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 16, 
    title: "Stress Relief Techniques", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=HJG2tTIxEfk",
    tags: ["stress", "relief", "techniques"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 17, 
    title: "Mental Health Toolkit", 
    category: "Tool", 
    link: "https://www.samhsa.gov",
    tags: ["toolkit", "resources", "mental health"],
    conditions: ["depression", "anxiety", "stress"],
    approaches: ["self-care", "support"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 18, 
    title: "Mindfulness and Meditation", 
    category: "Article", 
    link: "https://www.mindful.org",
    tags: ["mindfulness", "meditation", "wellness"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 19, 
    title: "Coping with Grief", 
    category: "Article", 
    link: "https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm",
    tags: ["grief", "loss", "coping"],
    conditions: ["grief"],
    approaches: ["self-care", "support"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 20, 
    title: "Managing Panic Attacks", 
    category: "Article", 
    link: "https://www.health.harvard.edu/mind-and-mood/what-to-do-when-youre-in-the-grip-of-a-panic-attack",
    tags: ["panic", "anxiety", "management"],
    conditions: ["anxiety", "panic"],
    approaches: ["cbt", "self-care"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 21, 
    title: "Trauma Recovery Resources", 
    category: "Article", 
    link: "https://www.nctsn.org",
    tags: ["trauma", "recovery", "resources"],
    conditions: ["trauma", "ptsd"],
    approaches: ["therapy", "support"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 22, 
    title: "Building Resilience", 
    category: "Article", 
    link: "https://www.apa.org/topics/resilience",
    tags: ["resilience", "coping", "strength"],
    approaches: ["self-care", "mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 23, 
    title: "Understanding PTSD", 
    category: "Article", 
    link: "https://www.ptsd.va.gov",
    tags: ["ptsd", "trauma", "understanding"],
    conditions: ["ptsd", "trauma"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 24, 
    title: "Self-help Techniques for Anxiety", 
    category: "Article", 
    link: "https://www.verywellmind.com/self-help-strategies-for-anxiety-disorders-2584268",
    tags: ["anxiety", "self-help", "techniques"],
    conditions: ["anxiety"],
    approaches: ["self-care", "cbt"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 25, 
    title: "Understanding Bipolar Disorder", 
    category: "Article", 
    link: "https://www.nimh.nih.gov/health/topics/bipolar-disorder",
    tags: ["bipolar", "disorder", "understanding"],
    conditions: ["bipolar"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 26, 
    title: "Managing OCD", 
    category: "Article", 
    link: "https://iocdf.org",
    tags: ["ocd", "managing", "obsessive-compulsive"],
    conditions: ["ocd"],
    approaches: ["cbt", "therapy"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 27, 
    title: "Understanding Schizophrenia", 
    category: "Article", 
    link: "https://www.nami.org/About-Mental-Illness/Mental-Health-Conditions/Schizophrenia",
    tags: ["schizophrenia", "understanding", "mental illness"],
    conditions: ["schizophrenia"],
    severity: ["severe"]
  },
  { 
    id: 28, 
    title: "Mindfulness for Kids", 
    category: "Article", 
    link: "https://www.mindful.org/mindfulness-for-kids",
    tags: ["mindfulness", "kids", "children"],
    approaches: ["mindfulness"],
    severity: ["mild"]
  },
  { 
    id: 29, 
    title: "Coping with Burnout", 
    category: "Article", 
    link: "https://hbr.org/2016/11/beating-burnout",
    tags: ["burnout", "coping", "work stress"],
    conditions: ["burnout", "stress"],
    approaches: ["self-care"],
    severity: ["moderate"]
  },
  { 
    id: 30, 
    title: "Online Therapy Platforms", 
    category: "Tool", 
    link: "https://www.betterhelp.com",
    tags: ["therapy", "online", "platforms"],
    approaches: ["therapy"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 31, 
    title: "Managing Social Anxiety", 
    category: "Article", 
    link: "https://adaa.org/understanding-anxiety/social-anxiety-disorder",
    tags: ["social anxiety", "managing", "anxiety"],
    conditions: ["anxiety", "social anxiety"],
    approaches: ["cbt", "therapy"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 32, 
    title: "Virtual Reality Therapy", 
    category: "Article", 
    link: "https://www.medicalnewstoday.com/articles/virtual-reality-therapy",
    tags: ["virtual reality", "therapy", "technology"],
    approaches: ["therapy", "technology"],
    severity: ["moderate"]
  },
  { 
    id: 33, 
    title: "Understanding Eating Disorders", 
    category: "Article", 
    link: "https://www.nationaleatingdisorders.org",
    tags: ["eating disorders", "understanding", "mental health"],
    conditions: ["eating disorder"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 34, 
    title: "Meditation for Sleep", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=aEqlQvczMJQ",
    tags: ["meditation", "sleep", "relaxation"],
    conditions: ["insomnia"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 35, 
    title: "Yoga and Mental Wellness", 
    category: "Article", 
    link: "https://www.yogajournal.com/lifestyle/health/yoga-for-mental-health",
    tags: ["yoga", "mental wellness", "exercise"],
    approaches: ["mindfulness", "exercise"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 36, 
    title: "Stress Reduction Techniques", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=O-6f5wQXSu8",
    tags: ["stress", "reduction", "techniques"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 37, 
    title: "Mindfulness Meditation for Anxiety", 
    category: "Article", 
    link: "https://www.mindful.org/mindfulness-meditation-anxiety",
    tags: ["mindfulness", "meditation", "anxiety"],
    conditions: ["anxiety"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 38, 
    title: "Mental Health Podcasts", 
    category: "Tool", 
    link: "https://www.healthline.com/health/mental-health/mental-health-podcasts",
    tags: ["podcasts", "mental health", "resources"],
    approaches: ["self-care", "education"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 39, 
    title: "Therapy Apps Comparison", 
    category: "Tool", 
    link: "https://www.techradar.com/best/best-therapy-apps",
    tags: ["therapy", "apps", "comparison"],
    approaches: ["therapy", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 40, 
    title: "Understanding Self-harm", 
    category: "Article", 
    link: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/self-harm",
    tags: ["self-harm", "understanding", "mental health"],
    conditions: ["self-harm"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 41, 
    title: "Teen Mental Health Resources", 
    category: "Article", 
    link: "https://www.teenmentalhealth.org",
    tags: ["teen", "mental health", "resources"],
    conditions: ["depression", "anxiety"],
    approaches: ["support", "education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 42, 
    title: "Mental Health in the Workplace", 
    category: "Article", 
    link: "https://www.mindtools.com/pages/article/mental-health-workplace.htm",
    tags: ["workplace", "mental health", "work"],
    conditions: ["stress", "burnout"],
    approaches: ["self-care", "support"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 43, 
    title: "Coping with Anxiety in the Digital Age", 
    category: "Article", 
    link: "https://www.apa.org/topics/anxiety/digital-age",
    tags: ["anxiety", "digital", "coping"],
    conditions: ["anxiety"],
    approaches: ["self-care", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 44, 
    title: "Integrative Approaches to Mental Health", 
    category: "Article", 
    link: "https://www.medicalnewstoday.com/articles/integrative-medicine-mental-health",
    tags: ["integrative", "approaches", "mental health"],
    approaches: ["holistic", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 45, 
    title: "The Science of Happiness", 
    category: "Article", 
    link: "https://www.happify.com/hd/the-science-of-happiness",
    tags: ["happiness", "science", "positive psychology"],
    approaches: ["positive psychology", "self-care"],
    severity: ["mild"]
  },
  { 
    id: 46, 
    title: "Psychology Today: Mental Health", 
    category: "Article", 
    link: "https://www.psychologytoday.com/us/basics/mental-health",
    tags: ["psychology", "mental health", "resources"],
    conditions: ["depression", "anxiety", "stress"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 47, 
    title: "Benefits of Journaling", 
    category: "Article", 
    link: "https://www.healthline.com/health/benefits-of-journaling",
    tags: ["journaling", "benefits", "self-care"],
    approaches: ["self-care", "expression"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 48, 
    title: "Mental Health Documentaries", 
    category: "Video", 
    link: "https://www.pbs.org/show/mysteries-mental-illness",
    tags: ["documentaries", "mental health", "education"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 49, 
    title: "Understanding Therapy Modalities", 
    category: "Article", 
    link: "https://www.goodtherapy.org/learn-about-therapy",
    tags: ["therapy", "modalities", "understanding"],
    approaches: ["therapy", "education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 50, 
    title: "Cognitive Behavioral Therapy Videos", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=2d--YgFA8xw",
    tags: ["cbt", "therapy", "videos"],
    approaches: ["cbt"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 51, 
    title: "The Power of Positive Thinking", 
    category: "Article", 
    link: "https://www.success.com/the-power-of-positive-thinking",
    tags: ["positive thinking", "power", "mindset"],
    approaches: ["positive psychology", "self-care"],
    severity: ["mild"]
  },
  { 
    id: 52, 
    title: "Online Support Groups for Mental Health", 
    category: "Tool", 
    link: "https://www.healthline.com/health/mental-health/online-support-groups",
    tags: ["support groups", "online", "mental health"],
    approaches: ["support", "community"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 53, 
    title: "Mental Health and Nutrition", 
    category: "Article", 
    link: "https://www.medicalnewstoday.com/articles/mental-health-diet",
    tags: ["nutrition", "mental health", "diet"],
    approaches: ["nutrition", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 54, 
    title: "Relaxation Techniques for Stress Relief", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=MIr3RsUWrdo",
    tags: ["relaxation", "stress relief", "techniques"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 55, 
    title: "Understanding Mental Illness Stigma", 
    category: "Article", 
    link: "https://www.nami.org/About-NAMI/NAMI-News/2021/NAMI-s-Statement-On-Recent-Racist-Incidents-and-Mental-Health-Resources-for-African-Americans",
    tags: ["stigma", "mental illness", "understanding"],
    approaches: ["education", "advocacy"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 56, 
    title: "Self-help Books for Mental Health", 
    category: "Article", 
    link: "https://www.goodreads.com/shelf/show/mental-health-self-help",
    tags: ["self-help", "books", "mental health"],
    approaches: ["self-care", "education"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 57, 
    title: "Virtual Mental Health Clinics", 
    category: "Tool", 
    link: "https://www.teladoc.com/therapy",
    tags: ["virtual", "clinics", "mental health"],
    approaches: ["therapy", "technology"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 58, 
    title: "Online Cognitive Behavioral Therapy", 
    category: "Tool", 
    link: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview",
    tags: ["cbt", "online", "therapy"],
    approaches: ["cbt", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 59, 
    title: "Digital Detox Tips", 
    category: "Article", 
    link: "https://www.healthline.com/nutrition/digital-detox",
    tags: ["digital detox", "tips", "technology"],
    approaches: ["self-care"],
    severity: ["mild"]
  },
  { 
    id: 60, 
    title: "How to Practice Mindfulness Daily", 
    category: "Article", 
    link: "https://www.mindful.org/how-to-practice-mindfulness",
    tags: ["mindfulness", "practice", "daily"],
    approaches: ["mindfulness"],
    severity: ["mild"]
  },
  { 
    id: 61, 
    title: "The Role of Exercise in Mental Health", 
    category: "Article", 
    link: "https://www.verywellfit.com/exercise-and-mental-health-4157062",
    tags: ["exercise", "mental health", "physical activity"],
    approaches: ["exercise", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 62, 
    title: "The Benefits of Nature for Mental Health", 
    category: "Article", 
    link: "https://www.apa.org/monitor/2020/04/nurtured-nature",
    tags: ["nature", "benefits", "mental health"],
    approaches: ["self-care", "environment"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 63, 
    title: "Managing Stress with Art Therapy", 
    category: "Article", 
    link: "https://www.goodtherapy.org/learn-about-therapy/types/art-therapy",
    tags: ["art therapy", "stress", "managing"],
    conditions: ["stress", "anxiety"],
    approaches: ["art therapy", "expression"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 64, 
    title: "Mental Health Benefits of Pets", 
    category: "Article", 
    link: "https://www.apa.org/news/press/releases/2011/07/pets-stress",
    tags: ["pets", "benefits", "mental health"],
    approaches: ["self-care", "support"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 65, 
    title: "Understanding Self-compassion", 
    category: "Article", 
    link: "https://self-compassion.org",
    tags: ["self-compassion", "understanding", "self-care"],
    approaches: ["self-care", "mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 66, 
    title: "Mindfulness-Based Stress Reduction", 
    category: "Article", 
    link: "https://www.umassmed.edu/cfm/mindfulness-based-programs/mbsr-courses",
    tags: ["mbsr", "stress reduction", "mindfulness"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 67, 
    title: "Coping with Loneliness", 
    category: "Article", 
    link: "https://www.health.harvard.edu/mind-and-mood/how-to-overcome-loneliness",
    tags: ["loneliness", "coping", "isolation"],
    conditions: ["depression"],
    approaches: ["self-care", "support"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 68, 
    title: "Managing Work Stress", 
    category: "Article", 
    link: "https://www.apa.org/topics/healthy-workplaces/work-stress",
    tags: ["work stress", "managing", "workplace"],
    conditions: ["stress", "burnout"],
    approaches: ["self-care", "boundaries"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 69, 
    title: "Depression and Mental Health", 
    category: "Article", 
    link: "https://www.who.int/news-room/fact-sheets/detail/depression",
    tags: ["depression", "mental health", "understanding"],
    conditions: ["depression"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 70, 
    title: "Understanding Seasonal Affective Disorder", 
    category: "Article", 
    link: "https://www.mayoclinic.org/diseases-conditions/seasonal-affective-disorder/symptoms-causes/syc-20364651",
    tags: ["sad", "seasonal", "disorder"],
    conditions: ["depression", "sad"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 71, 
    title: "Effective Stress Management Strategies", 
    category: "Article", 
    link: "https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/stress",
    tags: ["stress management", "strategies", "effective"],
    conditions: ["stress", "anxiety"],
    approaches: ["self-care", "coping"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 72, 
    title: "Understanding Mental Health in Minorities", 
    category: "Article", 
    link: "https://www.nami.org/Your-Journey/Identity-and-Cultural-Dimensions/Black-African-American",
    tags: ["minorities", "mental health", "cultural"],
    approaches: ["education", "cultural competence"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 73, 
    title: "Adolescent Mental Health Resources", 
    category: "Article", 
    link: "https://www.childmind.org/topics/teenagers",
    tags: ["adolescent", "teen", "resources"],
    conditions: ["depression", "anxiety"],
    approaches: ["support", "education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 74, 
    title: "The Impact of Social Media on Mental Health", 
    category: "Article", 
    link: "https://www.apa.org/topics/social-media-internet/technology-use-health",
    tags: ["social media", "impact", "mental health"],
    conditions: ["anxiety", "depression"],
    approaches: ["boundaries", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 75, 
    title: "Mindful Eating for Mental Health", 
    category: "Article", 
    link: "https://www.eatright.org/health/wellness/mindful-eating",
    tags: ["mindful eating", "nutrition", "mental health"],
    approaches: ["mindfulness", "nutrition"],
    severity: ["mild"]
  },
  { 
    id: 76, 
    title: "Meditation Techniques for Stress Relief", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=krBvzDlL0mM",
    tags: ["meditation", "stress relief", "techniques"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 77, 
    title: "Understanding Mental Health Disorders", 
    category: "Article", 
    link: "https://www.nimh.nih.gov/health/statistics/mental-illness",
    tags: ["mental health disorders", "understanding", "statistics"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 78, 
    title: "Holistic Approaches to Mental Wellness", 
    category: "Article", 
    link: "https://www.medicalnewstoday.com/articles/holistic-health",
    tags: ["holistic", "approaches", "wellness"],
    approaches: ["holistic", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 79, 
    title: "Digital Mental Health Tools", 
    category: "Tool", 
    link: "https://www.psychiatry.org/patients-families/digital-mental-health-tools",
    tags: ["digital", "tools", "mental health"],
    approaches: ["technology", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 80, 
    title: "Online CBT Resources", 
    category: "Tool", 
    link: "https://www.verywellmind.com/best-online-cbt-therapy-4691256",
    tags: ["cbt", "online", "resources"],
    approaches: ["cbt", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 81, 
    title: "Mental Health Policy and Advocacy", 
    category: "Article", 
    link: "https://www.mentalhealth.gov",
    tags: ["policy", "advocacy", "mental health"],
    approaches: ["advocacy", "education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 82, 
    title: "Virtual Support for Anxiety and Depression", 
    category: "Tool", 
    link: "https://www.7cups.com",
    tags: ["virtual support", "anxiety", "depression"],
    conditions: ["anxiety", "depression"],
    approaches: ["support", "technology"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 83, 
    title: "Effective Techniques for Mindfulness Meditation", 
    category: "Article", 
    link: "https://www.mindful.org/meditation/mindfulness-getting-started",
    tags: ["mindfulness meditation", "techniques", "effective"],
    approaches: ["mindfulness"],
    severity: ["mild"]
  },
  { 
    id: 84, 
    title: "Mental Health Webinars and Workshops", 
    category: "Tool", 
    link: "https://www.eventbrite.com/d/online/mental-health",
    tags: ["webinars", "workshops", "mental health"],
    approaches: ["education", "support"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 85, 
    title: "Understanding Emotional Wellness", 
    category: "Article", 
    link: "https://www.psychcentral.com/health/emotional-wellness",
    tags: ["emotional wellness", "understanding", "mental health"],
    approaches: ["self-care", "education"],
    severity: ["mild"]
  },
  { 
    id: 86, 
    title: "Managing Anxiety: Tips from Experts", 
    category: "Article", 
    link: "https://www.medicalnewstoday.com/articles/323454",
    tags: ["anxiety", "managing", "expert tips"],
    conditions: ["anxiety"],
    approaches: ["self-care", "cbt"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 87, 
    title: "Mental Health Online Communities", 
    category: "Tool", 
    link: "https://www.reddit.com/r/mentalhealth",
    tags: ["online communities", "mental health", "support"],
    approaches: ["support", "community"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 88, 
    title: "Self-Care Strategies for Busy Professionals", 
    category: "Article", 
    link: "https://www.forbes.com/health/mind/self-care-tips-busy-professionals",
    tags: ["self-care", "busy professionals", "strategies"],
    conditions: ["stress", "burnout"],
    approaches: ["self-care", "boundaries"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 89, 
    title: "Art and Mental Health", 
    category: "Article", 
    link: "https://www.tate.org.uk/art/art-terms/a/art-therapy",
    tags: ["art", "mental health", "creativity"],
    approaches: ["art therapy", "expression"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 90, 
    title: "The Role of Genetics in Mental Health", 
    category: "Article", 
    link: "https://www.genome.gov/health/Genomics-and-Medicine/Mental-Health",
    tags: ["genetics", "mental health", "research"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 91, 
    title: "Digital Tools for Stress Management", 
    category: "Tool", 
    link: "https://www.headspace.com",
    tags: ["digital tools", "stress management", "apps"],
    conditions: ["stress", "anxiety"],
    approaches: ["technology", "mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 92, 
    title: "Mental Health Research and Innovations", 
    category: "Article", 
    link: "https://www.nimh.nih.gov/research",
    tags: ["research", "innovations", "mental health"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 93, 
    title: "Virtual Reality in Mental Health Treatment", 
    category: "Article", 
    link: "https://www.technologyreview.com/2021/12/06/1041345/mental-health-care-metaverse",
    tags: ["virtual reality", "treatment", "technology"],
    approaches: ["technology", "therapy"],
    severity: ["moderate"]
  },
  { 
    id: 94, 
    title: "Mental Health Resources for Veterans", 
    category: "Article", 
    link: "https://www.ptsd.va.gov",
    tags: ["veterans", "resources", "mental health"],
    conditions: ["ptsd", "depression", "anxiety"],
    approaches: ["support", "therapy"],
    severity: ["moderate", "severe"]
  },
  { 
    id: 95, 
    title: "Understanding Anxiety Disorders", 
    category: "Article", 
    link: "https://www.adaa.org/understanding-anxiety",
    tags: ["anxiety disorders", "understanding", "mental health"],
    conditions: ["anxiety"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 96, 
    title: "Mindfulness and Mental Health", 
    category: "Article", 
    link: "https://www.mindful.org/mindfulness-mental-health",
    tags: ["mindfulness", "mental health", "wellness"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 97, 
    title: "Stress Reduction through Breathing Exercises", 
    category: "Video", 
    link: "https://www.youtube.com/watch?v=MIr3RsUWrdo",
    tags: ["breathing exercises", "stress reduction", "relaxation"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 98, 
    title: "Comprehensive Guide to Mental Health Apps", 
    category: "Tool", 
    link: "https://www.healthline.com/health/mental-health/mental-health-apps",
    tags: ["mental health apps", "guide", "technology"],
    approaches: ["technology", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 99, 
    title: "Online Mental Health Courses", 
    category: "Tool", 
    link: "https://www.coursera.org/collections/mental-health-wellness",
    tags: ["online courses", "mental health", "education"],
    approaches: ["education", "self-care"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 100, 
    title: "Mental Health Statistics and Reports", 
    category: "Article", 
    link: "https://www.who.int/health-topics/mental-health",
    tags: ["statistics", "reports", "mental health"],
    approaches: ["education"],
    severity: ["mild", "moderate", "severe"]
  },
  { 
    id: 101, 
    title: "Resources for Building Emotional Resilience", 
    category: "Article", 
    link: "https://www.psychologytoday.com/us/basics/resilience",
    tags: ["emotional resilience", "resources", "building"],
    approaches: ["self-care", "coping"],
    severity: ["mild", "moderate"]
  },
  { 
    id: 102, 
    title: "Mindfulness for Stress Management", 
    category: "Article", 
    link: "https://www.mindful.org/mindfulness-for-stress-relief",
    tags: ["mindfulness", "stress management", "relief"],
    conditions: ["stress", "anxiety"],
    approaches: ["mindfulness"],
    severity: ["mild", "moderate"]
  }
];

// Use the complete list of resources
const enhancedResources = resourcesData;

export default function ResourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResources, setFilteredResources] = useState(enhancedResources);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [activeTags, setActiveTags] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [mentalHealthNeeds, setMentalHealthNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get all unique tags from resources
  const allTags = [...new Set(enhancedResources.flatMap(resource => resource.tags || []))];
  
  // Client-side personalization based on user's assessment results
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || authLoading) return;
      
      setLoading(true);
      try {
        // Fetch latest assessment
        const assessmentResponse = await fetch('/api/assessment?limit=1');
        if (!assessmentResponse.ok) throw new Error('Failed to fetch assessment');
        
        const assessmentData = await assessmentResponse.json();
        const latestAssessment = assessmentData.assessments?.[0];
        
        // Fetch latest moods
        const moodResponse = await fetch('/api/mood?days=30');
        if (!moodResponse.ok) throw new Error('Failed to fetch moods');
        
        const moodData = await moodResponse.json();
        const recentMoods = moodData.moods || [];
        
        // Determine mental health needs based on assessment and moods
        const needs = [];
        
        // Check assessment scores
        if (latestAssessment) {
          if (latestAssessment.phq9Score >= 10) needs.push('depression');
          if (latestAssessment.gad7Score >= 10) needs.push('anxiety');
          if (latestAssessment.phq9Score >= 15 || latestAssessment.gad7Score >= 15) needs.push('severe symptoms');
        }
        
        // Check mood patterns
        if (recentMoods.length > 0) {
          const avgMood = recentMoods.reduce((sum, mood) => sum + mood.value, 0) / recentMoods.length;
          if (avgMood < 4) needs.push('low mood');
          
          // Check for mood volatility
          const moodValues = recentMoods.map(mood => mood.value);
          const moodVariance = calculateVariance(moodValues);
          if (moodVariance > 5) needs.push('mood swings');
          
          // Check for common activities in low moods
          const lowMoodActivities = recentMoods
            .filter(mood => mood.value < 4)
            .flatMap(mood => mood.activities || []);
          
          if (lowMoodActivities.includes('work')) needs.push('work stress');
          if (lowMoodActivities.includes('social')) needs.push('social anxiety');
          if (lowMoodActivities.includes('sleep')) needs.push('sleep problems');
        }
        
        setMentalHealthNeeds(needs);
        
        // Generate personalized recommendations based on needs
        if (needs.length > 0) {
          const recommendations = enhancedResources.filter(resource => {
            // Match resources with relevant conditions
            const conditionMatch = resource.conditions?.some(condition => 
              needs.includes(condition) || 
              (needs.includes('depression') && condition === 'depression') ||
              (needs.includes('anxiety') && condition === 'anxiety') ||
              (needs.includes('low mood') && condition === 'depression') ||
              (needs.includes('mood swings') && condition === 'bipolar') ||
              (needs.includes('work stress') && condition === 'stress') ||
              (needs.includes('sleep problems') && condition === 'insomnia')
            );
            
            // Match resources with relevant approaches
            const approachMatch = resource.approaches?.some(approach => 
              (needs.includes('anxiety') && ['mindfulness', 'cbt'].includes(approach)) ||
              (needs.includes('depression') && ['cbt', 'self-care'].includes(approach)) ||
              (needs.includes('stress') && ['mindfulness', 'self-care'].includes(approach))
            );
            
            // Match resources with appropriate severity
            const severityMatch = resource.severity?.some(sev => 
              (needs.includes('severe symptoms') && sev === 'severe') ||
              (!needs.includes('severe symptoms') && ['mild', 'moderate'].includes(sev))
            );
            
            return conditionMatch || approachMatch || severityMatch;
          });
          
          // Sort by relevance (number of matching factors)
          recommendations.sort((a, b) => {
            const aRelevance = countRelevanceFactors(a, needs);
            const bRelevance = countRelevanceFactors(b, needs);
            return bRelevance - aRelevance;
          });
          
          setRecommendedResources(recommendations.slice(0, 6));
          
          // Fetch recommended doctors based on needs
          fetchRecommendedDoctors(needs);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, authLoading]);
  
  // Helper function to calculate variance (for mood volatility)
  const calculateVariance = (values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    return squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  };
  
  // Helper function to count relevance factors for sorting
  const countRelevanceFactors = (resource, needs) => {
    let count = 0;
    
    // Count matching conditions
    if (resource.conditions) {
      count += resource.conditions.filter(condition => 
        needs.includes(condition) || 
        (needs.includes('depression') && condition === 'depression') ||
        (needs.includes('anxiety') && condition === 'anxiety') ||
        (needs.includes('low mood') && condition === 'depression') ||
        (needs.includes('mood swings') && condition === 'bipolar') ||
        (needs.includes('work stress') && condition === 'stress') ||
        (needs.includes('sleep problems') && condition === 'insomnia')
      ).length;
    }
    
    // Count matching approaches
    if (resource.approaches) {
      count += resource.approaches.filter(approach => 
        (needs.includes('anxiety') && ['mindfulness', 'cbt'].includes(approach)) ||
        (needs.includes('depression') && ['cbt', 'self-care'].includes(approach)) ||
        (needs.includes('stress') && ['mindfulness', 'self-care'].includes(approach))
      ).length;
    }
    
    // Count matching severity
    if (resource.severity) {
      count += resource.severity.filter(sev => 
        (needs.includes('severe symptoms') && sev === 'severe') ||
        (!needs.includes('severe symptoms') && ['mild', 'moderate'].includes(sev))
      ).length;
    }
    
    return count;
  };
  
  // Fetch recommended doctors based on mental health needs
  const fetchRecommendedDoctors = async (needs) => {
    try {
      // Map needs to specialties
      const specialties = [];
      if (needs.includes('depression') || needs.includes('low mood')) specialties.push('Psychiatrist');
      if (needs.includes('anxiety') || needs.includes('social anxiety')) specialties.push('Psychologist');
      if (needs.includes('severe symptoms')) specialties.push('Psychiatrist');
      if (needs.includes('mood swings')) specialties.push('Psychiatrist');
      
      // If we have specialties to search for
      if (specialties.length > 0) {
        const response = await fetch(`/api/doctors?specialty=${specialties.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        
        const data = await response.json();
        setRecommendedDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching recommended doctors:', error);
    }
  };
  
  // Handle search and filtering
  useEffect(() => {
    let results = enhancedResources;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(resource => 
        resource.title.toLowerCase().includes(term) || 
        resource.category.toLowerCase().includes(term) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // Filter by category tab
    if (activeTab !== 'all' && activeTab !== 'recommended' && activeTab !== 'saved') {
      results = results.filter(resource => resource.category === activeTab);
    }
    
    // Filter by active tags
    if (activeTags.length > 0) {
      results = results.filter(resource => 
        resource.tags && resource.tags.some(tag => activeTags.includes(tag))
      );
    }
    
    // Filter by saved resources
    if (activeTab === 'saved') {
      results = results.filter(resource => savedResources.includes(resource.id));
    }
    
    // Show recommended resources
    if (activeTab === 'recommended') {
      results = recommendedResources;
    }
    
    setFilteredResources(results);
  }, [searchTerm, activeTab, activeTags, savedResources, recommendedResources]);
  
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const toggleTag = (tag) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter(t => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };
  
  const handleSaveResource = (resourceId) => {
    if (!user) {
      router.push('/login?redirect=/resources');
      return;
    }
    
    // In a real implementation, this would call an API
    // For now, we'll just update the client-side state
    setSavedResources([...savedResources, resourceId]);
  };
  
  const handleUnsaveResource = (resourceId) => {
    // In a real implementation, this would call an API
    // For now, we'll just update the client-side state
    setSavedResources(savedResources.filter(id => id !== resourceId));
  };
  
  const isResourceSaved = (resourceId) => {
    return savedResources.includes(resourceId);
  };
  
  // Format mental health needs for display
  const formatNeeds = (needs) => {
    if (!needs || needs.length === 0) return '';
    
    return needs.map(need => 
      need.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(', ');
  };
  
  // Render resource card
  const renderResourceCard = (resource) => {
    const isSaved = isResourceSaved(resource.id);
    
    return (
      <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-blue-600">{resource.category}</p>
            <button
              onClick={() => isSaved ? handleUnsaveResource(resource.id) : handleSaveResource(resource.id)}
              className="text-gray-400 hover:text-yellow-500 focus:outline-none"
              aria-label={isSaved ? "Unsave resource" : "Save resource"}
            >
              {isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              )}
            </button>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{resource.title}</h3>
          {resource.tags && resource.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold cursor-pointer ${
                    activeTags.includes(tag) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <Link href={resource.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-block mt-2">
            Learn more
          </Link>
        </div>
      </div>
    );
  };
  
  // Render doctor card
  const renderDoctorCard = (doctor) => {
    return (
      <div key={doctor._id || doctor.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="p-6">
          <p className="text-sm font-medium text-green-600 mb-1">{doctor.specialty}</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
          {doctor.credentials && (
            <p className="text-sm text-gray-600 mb-2">{doctor.credentials}</p>
          )}
          {doctor.bio && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{doctor.bio}</p>
          )}
          <Link href={`/doctors/${doctor._id || doctor.id}`} className="text-blue-500 hover:underline inline-block mt-2">
            View Profile
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-black text-center mb-8">Mental Health Resources</h1>
      
      {/* Personalized Recommendations Section */}
      {user && recommendedResources.length > 0 && (
        <div className="mb-12">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-2">Personalized Recommendations</h2>
            {mentalHealthNeeds.length > 0 && (
              <p className="text-blue-700 mb-2">
                Based on your recent assessment and mood entries, we've identified resources that may help with: <span className="font-medium">{formatNeeds(mentalHealthNeeds)}</span>
              </p>
            )}
            <p className="text-sm text-blue-600">These recommendations are personalized to your needs and may change as you continue to use the platform.</p>
          </div>
          
          {/* Recommended Resources */}
          <h3 className="text-xl font-semibold mb-4">Recommended Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendedResources.slice(0, 3).map(resource => renderResourceCard(resource))}
          </div>
          {recommendedResources.length > 3 && (
            <div className="text-center mb-8">
              <button 
                onClick={() => handleTabChange('recommended')}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                View all recommended resources
              </button>
            </div>
          )}
          
          {/* Recommended Doctors */}
          {recommendedDoctors.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mb-4">Recommended Specialists</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recommendedDoctors.slice(0, 3).map(doctor => renderDoctorCard(doctor))}
              </div>
              {recommendedDoctors.length > 3 && (
                <div className="text-center mb-8">
                  <Link href="/doctors" className="text-blue-500 hover:text-blue-700 font-medium">
                    View all recommended specialists
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={handleSearch}
            className="flex-1 px-4 text-black py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap border-b mb-6">
          <button
            className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabChange('all')}
          >
            All
          </button>
          {user && recommendedResources.length > 0 && (
            <button
              className={`px-4 py-2 ${activeTab === 'recommended' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabChange('recommended')}
            >
              Recommended
            </button>
          )}
          {user && (
            <button
              className={`px-4 py-2 ${activeTab === 'saved' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabChange('saved')}
            >
              Saved
            </button>
          )}
          <button
            className={`px-4 py-2 ${activeTab === 'Article' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabChange('Article')}
          >
            Article
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'Video' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabChange('Video')}
          >
            Video
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'Tool' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabChange('Tool')}
          >
            Tool
          </button>
        </div>
        
        {/* Active Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-500">Active filters:</span>
            {activeTags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
              >
                {tag}
                <button 
                  type="button" 
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  onClick={() => toggleTag(tag)}
                >
                  &times;
                </button>
              </span>
            ))}
            <button 
              className="text-sm text-blue-500 hover:text-blue-700"
              onClick={() => setActiveTags([])}
            >
              Clear all
            </button>
          </div>
        )}
        
        {/* Popular Tags */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Popular tags:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 10).map(tag => (
              <span 
                key={tag} 
                className={`inline-block rounded-full px-2 py-1 text-xs font-semibold cursor-pointer ${
                  activeTags.includes(tag) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Resources list */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => renderResourceCard(resource))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === 'saved' 
                  ? 'You have no saved resources yet. Save resources by clicking the bookmark icon.'
                  : 'No resources found matching your search.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
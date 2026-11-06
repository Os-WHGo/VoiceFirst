/** Internal A1 editorial-only review, never included in public course navigation. */
import React,{useEffect,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {a1EditorialSceneTopics,startA1EditorialReview,currentA1EditorialReview,submitA1EditorialReview,advanceA1EditorialReview,type A1EditorialReviewState,type TargetLanguage} from '@voicefirst/core';

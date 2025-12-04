@echo off
cd "c:\Users\Jose Iturralde\Documents\1 thesis\Back\App"
call "c:\Users\Jose Iturralde\Documents\1 thesis\.venv\Scripts\activate.bat"
python test_evaluations_api.py > test_output.txt 2>&1
echo Test complete - check test_output.txt
